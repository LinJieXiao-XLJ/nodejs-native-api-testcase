'use strict';

/**
 * PLM / 本地执行共用的连接参数。
 * 环境变量优先；默认连执行机本地 TimechoDB（PLM 的 session-nodejs 不创建 K8s 实例）。
 */
const HOST = process.env.IOTDB_HOST || '127.0.0.1';
const PORT = Number(process.env.IOTDB_PORT || 6667);
const USERNAME = process.env.IOTDB_USER || 'root';
const PASSWORD = process.env.IOTDB_PASSWORD || 'TimechoDB@2021';

module.exports = { HOST, PORT, USERNAME, PASSWORD };
