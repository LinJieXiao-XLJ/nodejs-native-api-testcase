/**
 * Title：表模型 TableSession
 * Describe：模仿 table-session-pool.ts 示例
 */
'use strict';
const env = require('../helpers/testEnv');
const { TableSession, TableSessionPool, PoolConfigBuilder, ColumnCategory } = require('../../lib/@iotdb/client/index.js');

describe('表模型 TableSession', () => {
  let session;
  afterEach(async () => { if (session) { try { await session.close(); } catch (_) {} } });

  test('TableSession 构造', () => {
    session = new TableSession({
      host: env.HOST, port: env.PORT,
      username: env.USERNAME, password: env.PASSWORD,
    });
    expect(session).toBeDefined();
  });

  test('TableSession 带 database 参数', () => {
    session = new TableSession({
      host: env.HOST, port: env.PORT,
      username: env.USERNAME, password: env.PASSWORD,
      database: 'test_db',
    });
    expect(session).toBeDefined();
  });

  test('TableSessionPool 构造', () => {
    const pool = new TableSessionPool(env.HOST, env.PORT, {
      username: env.USERNAME, password: env.PASSWORD,
      database: 'test_db', maxPoolSize: 10,
    });
    expect(pool).toBeDefined();
  });
});

describe('ColumnCategory 枚举', () => {
  test('TAG=0, FIELD=1, ATTRIBUTE=2, TIME=3', () => {
    expect(ColumnCategory.TAG).toBe(0);
    expect(ColumnCategory.FIELD).toBe(1);
    expect(ColumnCategory.ATTRIBUTE).toBe(2);
    expect(ColumnCategory.TIME).toBe(3);
  });
});
