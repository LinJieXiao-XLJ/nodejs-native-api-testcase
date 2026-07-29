/**
 * Title：树模型-集成测试（连接真实 IoTDB）
 * Describe：模仿 basic-session.ts 示例，端到端验证 Session 完整流程
 */
'use strict';
const { Session, ConfigBuilder, TSDataType, TreeTablet } = require('../../lib/@iotdb/client/index.js');

const HOST = '127.0.0.1', PORT = 6667;
const cfg = () => new ConfigBuilder().host(HOST).port(PORT).username('root').password('root').build();
const DB = 'root.test_nodejs';

describe('树模型集成测试（真实 IoTDB）', () => {
  let session;
  beforeEach(async () => { session = new Session(cfg()); await session.open(); }, 30000);
  afterEach(async () => { if (session) { try { await session.close(); } catch (_) {} } });

  describe('元数据操作', () => {
    test('CREATE DATABASE + SHOW DATABASES', async () => {
      await session.executeNonQueryStatement('CREATE DATABASE ' + DB);
      const ds = await session.executeQueryStatement('SHOW DATABASES');
      let found = false;
      while (await ds.hasNext()) { if (ds.next().getFields()[0] === DB) found = true; }
      await ds.close();
      expect(found).toBe(true);
    }, 30000);

    test('重复创建同名数据库应抛错', async () => {
      await expect(session.executeNonQueryStatement('CREATE DATABASE ' + DB)).rejects.toThrow();
    }, 30000);
  });

  describe('数据写入与查询', () => {
    test('CREATE TIMESERIES + insertTablet + executeQueryStatement', async () => {
      const d = DB + '.d1';
      await session.executeNonQueryStatement('CREATE TIMESERIES ' + d + '.s1 WITH DATATYPE=FLOAT, ENCODING=RLE');
      await session.executeNonQueryStatement('CREATE TIMESERIES ' + d + '.s2 WITH DATATYPE=TEXT, ENCODING=PLAIN');

      const t = new TreeTablet(d, ['s1', 's2'], [TSDataType.FLOAT, TSDataType.TEXT]);
      const now = Date.now();
      for (let i = 0; i < 10; i++) t.addRow(now + i * 1000, [25.5 + i, 'val' + i]);
      await session.insertTablet(t);

      const ds = await session.executeQueryStatement('SELECT s1,s2 FROM ' + d + ' LIMIT 20');
      let rows = 0;
      while (await ds.hasNext()) {
        const r = ds.next();
        expect(typeof r.getTimestamp()).toBe('number');
        rows++;
      }
      await ds.close();
      expect(rows).toBeGreaterThanOrEqual(10);
    }, 30000);

    test('SessionDataSet close 后可正常结束', async () => {
      const ds = await session.executeQueryStatement('SHOW DATABASES');
      await ds.close();
      // 真实 IoTDB SessionDataSet close 后 hasNext 返回 false
      const more = await ds.hasNext();
      expect(more).toBe(false);
    }, 30000);
  });

  describe('清理', () => {
    test('DELETE DATABASE', async () => {
      await session.executeNonQueryStatement('DELETE DATABASE ' + DB);
      const ds = await session.executeQueryStatement('SHOW DATABASES');
      let found = false;
      while (await ds.hasNext()) { if (ds.next().getFields()[0] === DB) found = true; }
      await ds.close();
      expect(found).toBe(false);
    }, 30000);
  });
});
