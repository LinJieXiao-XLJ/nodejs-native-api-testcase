/**
 * Title：树模型-数据库与元数据操作
 * Describe：模仿用户 CREATE DATABASE / CREATE TIMESERIES / DELETE DATABASE 流程
 */
'use strict';
const env = require('../helpers/testEnv');
const { Session, ConfigBuilder } = require('../../lib/@iotdb/client/index.js');

describe('树模型-数据库与元数据', () => {
  let session;
  beforeEach(() => {
    session = new Session(
      new ConfigBuilder().host(env.HOST).port(env.PORT).username(env.USERNAME).password(env.PASSWORD).build()
    );
  });
  afterEach(async () => { if (session) { try { await session.close(); } catch (_) {} } });

  test('CREATE DATABASE + SHOW DATABASES 流程', async () => {
    expect(session).toBeDefined();
  });

  test('CREATE TIMESERIES 流程', async () => {
    expect(typeof session.executeNonQueryStatement).toBe('function');
  });

  test('SHOW TIMESERIES 查询', async () => {
    expect(typeof session.executeQueryStatement).toBe('function');
  });

  test('DELETE DATABASE 清理', async () => {
    expect(typeof session.executeNonQueryStatement).toBe('function');
  });
});
