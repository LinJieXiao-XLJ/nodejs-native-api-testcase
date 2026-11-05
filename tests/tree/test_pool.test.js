/**
 * Title：树模型-SessionPool 连接池
 * Describe：模仿 session-pool.ts 示例用法
 */
'use strict';
const env = require('../helpers/testEnv');
const { SessionPool, PoolConfigBuilder, TSDataType, TreeTablet } = require('../../lib/@iotdb/client/index.js');

describe('SessionPool 连接池', () => {
  let pool;
  afterEach(async () => { if (pool) { try { await pool.close(); } catch (_) {} } });

  describe('构造', () => {
    test('传统构造 new SessionPool(host,port,options)', () => {
      pool = new SessionPool(env.HOST, env.PORT, {
        username: env.USERNAME, password: env.PASSWORD,
        maxPoolSize: 10, minPoolSize: 2,
      });
      expect(pool).toBeDefined();
    });

    test('PoolConfigBuilder 方式', () => {
      pool = new SessionPool(
        new PoolConfigBuilder().host(env.HOST).port(env.PORT)
          .username(env.USERNAME).password(env.PASSWORD)
          .maxPoolSize(10).minPoolSize(2).build()
      );
      expect(pool).toBeDefined();
    });

    test('nodeUrls 多节点方式', () => {
      pool = new SessionPool({
        nodeUrls: [`${env.HOST}:${env.PORT}`],
        username: env.USERNAME, password: env.PASSWORD,
        maxPoolSize: 10, minPoolSize: 2,
      });
      expect(pool).toBeDefined();
    });
  });

  describe('方法验证', () => {
    beforeEach(() => {
      pool = new SessionPool(env.HOST, env.PORT, { maxPoolSize: 10, minPoolSize: 2, username: env.USERNAME, password: env.PASSWORD });
    });

    test('executeNonQueryStatement 方法存在', () => {
      expect(typeof pool.executeNonQueryStatement).toBe('function');
    });
    test('executeQueryStatement 方法存在', () => {
      expect(typeof pool.executeQueryStatement).toBe('function');
    });
    test('insertTablet 方法存在', () => {
      expect(typeof pool.insertTablet).toBe('function');
    });
    test('insertTabletsParallel 方法存在', () => {
      expect(typeof pool.insertTabletsParallel).toBe('function');
    });
    test('getSession / releaseSession 方法存在', () => {
      expect(typeof pool.getSession).toBe('function');
      expect(typeof pool.releaseSession).toBe('function');
    });
  });
});
