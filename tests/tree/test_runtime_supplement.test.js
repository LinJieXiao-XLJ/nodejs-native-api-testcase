/**
 * V2-977 补充运行时验证
 *
 * 覆盖范围：
 * 1. Session.insertTablets 是否通过一次底层 RPC 写入多个 Tablet；
 * 2. Session.insertTabletsParallel 是否真实并发调用写入接口；
 * 3. SessionPool 借还、Dataset 关闭和 close 后是否释放 socket；
 * 4. 共享设备 + SELECT * 导致 LargeQuery 读到 5011 行的确定性根因；
 * 5. 独立 20000 行结果集是否真实调用 fetchResultsV2。
 */
'use strict';

const {
  Session,
  SessionPool,
  ConfigBuilder,
  TreeTablet,
  TSDataType,
} = require('../../lib/@iotdb/client/index.js');

const HOST = process.env.IOTDB_HOST || '127.0.0.1';
const PORT = Number(process.env.IOTDB_PORT || 6667);
const USERNAME = process.env.IOTDB_USER || 'root';
const PASSWORD = process.env.IOTDB_PASSWORD || 'TimechoDB@2021';
const DB = 'root.v2_977_supplement';

function config(overrides = {}) {
  return new ConfigBuilder()
    .host(HOST)
    .port(PORT)
    .username(USERNAME)
    .password(PASSWORD)
    .fetchSize(overrides.fetchSize || 1024)
    .build();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeClose(resource) {
  if (!resource) return;
  try {
    await resource.close();
  } catch (_) {
    // Best-effort cleanup only.
  }
}

function liveRpcSockets() {
  if (typeof process._getActiveHandles !== 'function') return [];
  return process
    ._getActiveHandles()
    .filter(
      (handle) =>
        handle &&
        handle.constructor &&
        handle.constructor.name === 'Socket' &&
        handle.remotePort === PORT &&
        !handle.destroyed,
    );
}

async function destroyRpcSockets() {
  const sockets = liveRpcSockets();
  for (const socket of sockets) {
    try {
      socket.destroy();
    } catch (_) {
      // Best-effort cleanup only.
    }
  }
  await delay(200);
  return sockets.length;
}

function logEvidence(id, details) {
  console.log(`[V2-977-SUPPLEMENT] ${JSON.stringify({ id, ...details })}`);
}

async function openSession(overrides = {}) {
  const session = new Session(config(overrides));
  await session.open();
  return session;
}

async function queryRows(session, sql) {
  const dataSet = await session.executeQueryStatement(sql);
  const rows = [];
  const columnNames = dataSet.getColumnNames();
  try {
    while (await dataSet.hasNext()) {
      rows.push(dataSet.next());
    }
  } finally {
    await dataSet.close();
  }
  return { rows, columnNames };
}

async function dropDatabase(session) {
  try {
    await session.executeNonQueryStatement(`DROP DATABASE ${DB}`);
  } catch (_) {
    // A missing database is already a clean state.
  }
}

async function createFloatSeries(session, path) {
  await session.executeNonQueryStatement(
    `CREATE TIMESERIES ${path} WITH DATATYPE=FLOAT, ENCODING=RLE`,
  );
}

function oneRowTablet(deviceId, timestamp, value) {
  const tablet = new TreeTablet(deviceId, ['s1'], [TSDataType.FLOAT]);
  tablet.addRow(timestamp, [value]);
  return tablet;
}

describe('V2-977 补充运行时验证（真实 IoTDB）', () => {
  beforeAll(async () => {
    const session = await openSession();
    try {
      await dropDatabase(session);
      await session.executeNonQueryStatement(`CREATE DATABASE ${DB}`);
    } finally {
      await safeClose(session);
    }
    await delay(200);
  }, 60000);

  afterAll(async () => {
    let session;
    try {
      session = await openSession();
      await dropDatabase(session);
    } finally {
      await safeClose(session);
    }
    await delay(300);
    const forcedCleanup = await destroyRpcSockets();
    logEvidence('CLEANUP', {
      forcedSocketCleanup: forcedCleanup,
      socketsAfterCleanup: liveRpcSockets().length,
    });
  }, 60000);

  test('Session.insertTablets 使用一次 RPC 并精确写入多个设备', async () => {
    const session = await openSession();
    const deviceCount = 4;
    const rowsPerDevice = 2;
    const baseTime = Date.now();
    let rpcCalls = 0;
    try {
      const tablets = [];
      for (let index = 0; index < deviceCount; index += 1) {
        const device = `${DB}.batch_d${index}`;
        await createFloatSeries(session, `${device}.s1`);
        const tablet = new TreeTablet(device, ['s1'], [TSDataType.FLOAT]);
        tablet.addRow(baseTime + index * 10, [index + 0.25]);
        tablet.addRow(baseTime + index * 10 + 1, [index + 0.75]);
        tablets.push(tablet);
      }

      const client = session.connection.getClient();
      const originalInsertTablets = client.insertTablets;
      expect(typeof originalInsertTablets).toBe('function');
      client.insertTablets = function instrumentedInsertTablets(...args) {
        rpcCalls += 1;
        return originalInsertTablets.apply(this, args);
      };
      try {
        await session.insertTablets(tablets);
      } finally {
        client.insertTablets = originalInsertTablets;
      }

      let totalRows = 0;
      for (let index = 0; index < deviceCount; index += 1) {
        const result = await queryRows(
          session,
          `SELECT s1 FROM ${DB}.batch_d${index}`,
        );
        expect(result.rows).toHaveLength(rowsPerDevice);
        totalRows += result.rows.length;
      }

      logEvidence('TC-BATCH-01', {
        deviceCount,
        rowsPerDevice,
        totalRows,
        insertTabletsRpcCalls: rpcCalls,
      });
      expect(rpcCalls).toBe(1);
      expect(totalRows).toBe(deviceCount * rowsPerDevice);
    } finally {
      await safeClose(session);
    }
  }, 120000);

  test('Session.insertTabletsParallel 真实调用逐 Tablet RPC 并全部落库', async () => {
    const session = await openSession();
    const tabletCount = 12;
    const concurrency = 4;
    const baseTime = Date.now() + 100000;
    let rpcCalls = 0;
    let activeRpcCalls = 0;
    let maxConcurrentRpcCalls = 0;
    try {
      const tablets = [];
      for (let index = 0; index < tabletCount; index += 1) {
        const device = `${DB}.parallel_d${index}`;
        await createFloatSeries(session, `${device}.s1`);
        tablets.push(oneRowTablet(device, baseTime + index, index + 1.5));
      }

      const client = session.connection.getClient();
      const originalInsertTablet = client.insertTablet;
      expect(typeof originalInsertTablet).toBe('function');
      client.insertTablet = async function instrumentedInsertTablet(...args) {
        rpcCalls += 1;
        activeRpcCalls += 1;
        maxConcurrentRpcCalls = Math.max(
          maxConcurrentRpcCalls,
          activeRpcCalls,
        );
        try {
          return await originalInsertTablet.apply(this, args);
        } finally {
          activeRpcCalls -= 1;
        }
      };
      try {
        await session.insertTabletsParallel(tablets, concurrency);
      } finally {
        client.insertTablet = originalInsertTablet;
      }

      let persistedDevices = 0;
      for (let index = 0; index < tabletCount; index += 1) {
        const result = await queryRows(
          session,
          `SELECT s1 FROM ${DB}.parallel_d${index}`,
        );
        if (result.rows.length === 1) persistedDevices += 1;
      }

      logEvidence('TC-BATCH-02', {
        tabletCount,
        concurrency,
        insertTabletRpcCalls: rpcCalls,
        maxConcurrentRpcCalls,
        persistedDevices,
      });
      expect(rpcCalls).toBe(tabletCount);
      expect(maxConcurrentRpcCalls).toBeGreaterThan(1);
      expect(maxConcurrentRpcCalls).toBeLessThanOrEqual(concurrency);
      expect(activeRpcCalls).toBe(0);
      expect(persistedDevices).toBe(tabletCount);
    } finally {
      await safeClose(session);
    }
  }, 120000);

  test('SessionPool 借还、并发写入、Dataset close 和 pool.close 均释放资源', async () => {
    const setupSession = await openSession();
    const tabletCount = 8;
    const baseTime = Date.now() + 200000;
    try {
      for (let index = 0; index < tabletCount; index += 1) {
        await createFloatSeries(setupSession, `${DB}.pool_d${index}.s1`);
      }
    } finally {
      await safeClose(setupSession);
    }
    await delay(300);
    expect(liveRpcSockets()).toHaveLength(0);

    const pool = new SessionPool({
      host: HOST,
      port: PORT,
      username: USERNAME,
      password: PASSWORD,
      minPoolSize: 2,
      maxPoolSize: 4,
      fetchSize: 100,
    });

    let statsAfterInit;
    let statsAfterBorrow;
    let statsAfterRelease;
    let statsDuringQuery;
    let statsAfterQueryClose;
    let statsAfterParallel;
    let socketsAfterClose = -1;
    try {
      await pool.init();
      statsAfterInit = pool.getPoolStats();

      const borrowed = await pool.getSession();
      statsAfterBorrow = pool.getPoolStats();
      pool.releaseSession(borrowed);
      statsAfterRelease = pool.getPoolStats();

      const dataSet = await pool.executeQueryStatement('SHOW DATABASES');
      statsDuringQuery = pool.getPoolStats();
      await dataSet.close();
      await delay(50);
      statsAfterQueryClose = pool.getPoolStats();

      const tablets = [];
      for (let index = 0; index < tabletCount; index += 1) {
        tablets.push(
          oneRowTablet(`${DB}.pool_d${index}`, baseTime + index, index + 10.5),
        );
      }
      await pool.insertTabletsParallel(tablets, { concurrency: 4 });
      statsAfterParallel = pool.getPoolStats();

      expect(statsAfterInit).toMatchObject({ total: 2, idle: 2, active: 0 });
      expect(statsAfterBorrow.active).toBe(1);
      expect(statsAfterRelease.active).toBe(0);
      expect(statsDuringQuery.active).toBe(1);
      expect(statsAfterQueryClose.active).toBe(0);
      expect(statsAfterParallel.active).toBe(0);
      expect(statsAfterParallel.total).toBeLessThanOrEqual(4);
    } finally {
      await safeClose(pool);
      await delay(500);
      socketsAfterClose = liveRpcSockets().length;
    }

    const verifySession = await openSession();
    let persistedDevices = 0;
    try {
      for (let index = 0; index < tabletCount; index += 1) {
        const result = await queryRows(
          verifySession,
          `SELECT s1 FROM ${DB}.pool_d${index}`,
        );
        if (result.rows.length === 1) persistedDevices += 1;
      }
    } finally {
      await safeClose(verifySession);
    }

    logEvidence('TC-POOL-01', {
      statsAfterInit,
      statsAfterBorrow,
      statsAfterRelease,
      statsDuringQuery,
      statsAfterQueryClose,
      statsAfterParallel,
      persistedDevices,
      socketsAfterClose,
    });
    expect(persistedDevices).toBe(tabletCount);
    expect(socketsAfterClose).toBe(0);
  }, 120000);

  test('LargeQuery 的 5011 行由共享设备残留时间点和 SELECT * 确定性产生', async () => {
    const session = await openSession();
    const device = `${DB}.contaminated_d1`;
    const legacyMeasurements = Array.from(
      { length: 10 },
      (_, index) => `legacy_${index}`,
    );
    const mainMeasurements = ['sensor1', 'sensor2', 'sensor3'];
    const baseTime = Date.now() + 300000;
    try {
      for (const measurement of [...legacyMeasurements, ...mainMeasurements]) {
        await createFloatSeries(session, `${device}.${measurement}`);
      }

      const legacyTablet = new TreeTablet(
        device,
        legacyMeasurements,
        legacyMeasurements.map(() => TSDataType.FLOAT),
      );
      for (let row = 0; row < 11; row += 1) {
        legacyTablet.addRow(
          baseTime - 1000 - row,
          legacyMeasurements.map((_, index) => row + index / 10),
        );
      }
      await session.insertTablet(legacyTablet);

      const mainTablet = new TreeTablet(
        device,
        mainMeasurements,
        mainMeasurements.map(() => TSDataType.FLOAT),
      );
      for (let row = 0; row < 5000; row += 1) {
        mainTablet.addRow(baseTime + row, [row + 0.1, row + 0.2, row + 0.3]);
      }
      await session.insertTablet(mainTablet);

      const selectAll = await queryRows(session, `SELECT * FROM ${device}`);
      const isolated = await queryRows(
        session,
        `SELECT sensor1 FROM ${device} WHERE time >= ${baseTime} AND time < ${baseTime + 5000}`,
      );
      const count = await queryRows(
        session,
        `SELECT COUNT(sensor1) FROM ${device}`,
      );
      const sensor1Count = Number(count.rows[0].getFields()[0]);

      logEvidence('TC-LARGE-ROOT-CAUSE', {
        selectAllRows: selectAll.rows.length,
        selectAllColumns: selectAll.columnNames.length,
        isolatedSensor1Rows: isolated.rows.length,
        sensor1Count,
        legacyTimestamps: 11,
        mainTimestamps: 5000,
      });
      expect(selectAll.rows).toHaveLength(5011);
      expect(selectAll.columnNames).toHaveLength(13);
      expect(isolated.rows).toHaveLength(5000);
      expect(sensor1Count).toBe(5000);
    } finally {
      await safeClose(session);
    }
  }, 120000);

  test('独立 20000 行、fetchSize=100 时应真实调用 fetchResultsV2', async () => {
    const session = await openSession({ fetchSize: 100 });
    const device = `${DB}.large_d1`;
    const rowCount = 20000;
    const baseTime = Date.now() + 400000;
    try {
      await createFloatSeries(session, `${device}.s1`);
      const tablet = new TreeTablet(device, ['s1'], [TSDataType.FLOAT]);
      for (let row = 0; row < rowCount; row += 1) {
        tablet.addRow(baseTime + row, [row + 0.5]);
      }
      await session.insertTablet(tablet);

      async function collectMetrics(sql) {
        const client = session.connection.getClient();
        const originalFetchResultsV2 = client.fetchResultsV2;
        let fetchResultsV2Calls = 0;
        client.fetchResultsV2 = function instrumentedFetchResultsV2(...args) {
          fetchResultsV2Calls += 1;
          return originalFetchResultsV2.apply(this, args);
        };

        let dataSet;
        let initialBatchSize = -1;
        let hasMoreDataInitially = false;
        let actualRows = 0;
        const fetchedBatchSizes = [];
        try {
          dataSet = await session.executeQueryStatement(sql);
          initialBatchSize = Array.isArray(dataSet.currentRows)
            ? dataSet.currentRows.length
            : -1;
          hasMoreDataInitially = Boolean(dataSet.hasMoreData);
          const originalFetchNextBatch = dataSet.fetchNextBatch.bind(dataSet);
          dataSet.fetchNextBatch = async function instrumentedFetchNextBatch() {
            const fetched = await originalFetchNextBatch();
            fetchedBatchSizes.push(this.currentRows.length);
            return fetched;
          };
          while (await dataSet.hasNext()) {
            dataSet.next();
            actualRows += 1;
          }
        } finally {
          client.fetchResultsV2 = originalFetchResultsV2;
          if (dataSet) await dataSet.close();
        }
        return {
          sql,
          actualRows,
          initialBatchSize,
          hasMoreDataInitially,
          fetchResultsV2Calls,
          fetchedBatchSizes,
        };
      }

      const fiveThousandRows = await collectMetrics(
        `SELECT s1 FROM ${device} LIMIT 5000`,
      );
      const twentyThousandRows = await collectMetrics(
        `SELECT s1 FROM ${device}`,
      );
      const metrics = {
        configuredFetchSize: 100,
        fiveThousandRows,
        twentyThousandRows,
      };
      logEvidence('TC-LARGE-PAGINATION', metrics);
      expect(fiveThousandRows.actualRows).toBe(5000);
      expect(twentyThousandRows.actualRows).toBe(rowCount);
      if (
        !twentyThousandRows.hasMoreDataInitially ||
        twentyThousandRows.fetchResultsV2Calls === 0
      ) {
        throw new Error(`pagination RPC not observed: ${JSON.stringify(metrics)}`);
      }
    } finally {
      await safeClose(session);
    }
  }, 120000);
});
