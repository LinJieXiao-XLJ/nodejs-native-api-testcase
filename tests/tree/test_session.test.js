/**
 * Title：测试树模型 Session 连接
 * Describe：模仿用户使用 ConfigBuilder / Session / TreeTablet 的完整流程
 * Author：肖林捷  Date：2026/07/23
 */
'use strict';
const env = require('../helpers/testEnv');
const { Session, ConfigBuilder, TSDataType, TreeTablet } = require('../../lib/@iotdb/client/index.js');

describe('Session 连接管理', () => {
  let session;
  afterEach(async () => { if (session) { try { await session.close(); } catch (_) {} } });

  // ====== 基础连接与关闭 ======
  describe('构造与生命周期', () => {

    test('最简参数构造', () => {
      session = new Session({ host: env.HOST, port: env.PORT, username: env.USERNAME, password: env.PASSWORD });
      expect(session).toBeDefined();
    });

    test('ConfigBuilder 构建配置', () => {
      session = new Session(
        new ConfigBuilder().host(env.HOST).port(env.PORT)
          .username(env.USERNAME).password(env.PASSWORD).fetchSize(5000).build()
      );
      expect(session).toBeDefined();
    });

    test('缺 host 和 nodeUrls 抛异常', () => {
      expect(() => new Session({})).toThrow();
    });

    test('nodeUrls 空数组抛异常', () => {
      expect(() => new Session({ nodeUrls: [] })).toThrow();
    });
  });

  // ====== 完整参数构造 ======
  describe('ConfigBuilder 完整参数', () => {

    test('指定 fetchSize', () => {
      const cfg = new ConfigBuilder().host(env.HOST).port(env.PORT)
        .username(env.USERNAME).password(env.PASSWORD).fetchSize(5000).build();
      session = new Session(cfg);
      expect(session).toBeDefined();
    });

    test('指定 timezone', () => {
      const cfg = new ConfigBuilder().host(env.HOST).port(env.PORT)
        .username(env.USERNAME).password(env.PASSWORD).timezone('+08:00').build();
      session = new Session(cfg);
      expect(session).toBeDefined();
    });

    test('指定 enableSSL', () => {
      const cfg = new ConfigBuilder().host(env.HOST).port(env.PORT)
        .username(env.USERNAME).password(env.PASSWORD).enableSSL(true).build();
      session = new Session(cfg);
      expect(session).toBeDefined();
    });
  });
});

describe('TreeTablet 构造（模仿 basic-session.ts 示例）', () => {

  test('new TreeTablet + addRow 方式', () => {
    const tablet = new TreeTablet('root.example.device1',
      ['temperature', 'humidity'],
      [TSDataType.FLOAT, TSDataType.FLOAT]
    );
    tablet.addRow(Date.now(), [25.5, 60.0]);
    tablet.addRow(Date.now() + 1000, [26.0, 61.5]);
    expect(tablet.timestamps.length).toBe(2);
    expect(tablet.values.length).toBe(2);
  });

  test('plain object 方式（兼容旧 API）', () => {
    const tablet = {
      deviceId: 'root.example.device1',
      measurements: ['temperature', 'humidity'],
      dataTypes: [TSDataType.FLOAT, TSDataType.FLOAT],
      timestamps: [Date.now(), Date.now() + 1000],
      values: [[27.0, 63.0], [27.5, 64.0]],
    };
    expect(tablet.deviceId).toBe('root.example.device1');
    expect(tablet.timestamps.length).toBe(2);
  });
});
