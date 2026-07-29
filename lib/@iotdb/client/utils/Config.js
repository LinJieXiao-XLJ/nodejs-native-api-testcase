"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Config_exports = {};
__export(Config_exports, {
  ConfigBuilder: () => ConfigBuilder,
  DEFAULT_CONFIG: () => DEFAULT_CONFIG,
  DEFAULT_POOL_CONFIG: () => DEFAULT_POOL_CONFIG,
  PoolConfigBuilder: () => PoolConfigBuilder,
  SQL_DIALECT_TABLE: () => SQL_DIALECT_TABLE,
  SQL_DIALECT_TREE: () => SQL_DIALECT_TREE,
  parseNodeUrls: () => parseNodeUrls
});
module.exports = __toCommonJS(Config_exports);
const SQL_DIALECT_TREE = "tree";
const SQL_DIALECT_TABLE = "table";
function parseNodeUrls(nodeUrls) {
  return nodeUrls.map((url) => {
    const parts = url.split(":");
    if (parts.length !== 2) {
      throw new Error(`Invalid nodeUrl format: ${url}. Expected format: "host:port"`);
    }
    const host = parts[0].trim();
    const port = parseInt(parts[1].trim(), 10);
    if (!host || isNaN(port) || port <= 0 || port > 65535) {
      throw new Error(`Invalid nodeUrl format: ${url}. Host must be non-empty and port must be a valid number (1-65535)`);
    }
    return { host, port };
  });
}
const DEFAULT_CONFIG = {
  host: "localhost",
  port: 6667,
  username: "root",
  password: "root",
  fetchSize: 1024,
  enableSSL: false,
  enableFastSerialization: true
  // Enable by default for better performance
};
const DEFAULT_POOL_CONFIG = {
  ...DEFAULT_CONFIG,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTime: 6e4,
  // 60 seconds
  waitTimeout: 6e4,
  // 60 seconds
  enableRedirection: true,
  redirectCacheTTL: 3e5
  // 5 minutes
};
class ConfigBuilder {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }
  host(host) {
    this.config.host = host;
    return this;
  }
  port(port) {
    this.config.port = port;
    return this;
  }
  nodeUrls(nodeUrls) {
    this.config.nodeUrls = nodeUrls;
    return this;
  }
  username(username) {
    this.config.username = username;
    return this;
  }
  password(password) {
    this.config.password = password;
    return this;
  }
  database(database) {
    this.config.database = database;
    return this;
  }
  timezone(timezone) {
    this.config.timezone = timezone;
    return this;
  }
  fetchSize(fetchSize) {
    this.config.fetchSize = fetchSize;
    return this;
  }
  enableSSL(enable) {
    this.config.enableSSL = enable;
    return this;
  }
  sslOptions(sslOptions) {
    this.config.sslOptions = sslOptions;
    return this;
  }
  build() {
    return this.config;
  }
}
class PoolConfigBuilder extends ConfigBuilder {
  constructor() {
    super();
    this.poolConfig = { ...DEFAULT_POOL_CONFIG };
  }
  host(host) {
    this.poolConfig.host = host;
    return this;
  }
  port(port) {
    this.poolConfig.port = port;
    return this;
  }
  nodeUrls(nodeUrls) {
    this.poolConfig.nodeUrls = nodeUrls;
    return this;
  }
  username(username) {
    this.poolConfig.username = username;
    return this;
  }
  password(password) {
    this.poolConfig.password = password;
    return this;
  }
  database(database) {
    this.poolConfig.database = database;
    return this;
  }
  timezone(timezone) {
    this.poolConfig.timezone = timezone;
    return this;
  }
  fetchSize(fetchSize) {
    this.poolConfig.fetchSize = fetchSize;
    return this;
  }
  enableSSL(enable) {
    this.poolConfig.enableSSL = enable;
    return this;
  }
  sslOptions(sslOptions) {
    this.poolConfig.sslOptions = sslOptions;
    return this;
  }
  maxPoolSize(size) {
    this.poolConfig.maxPoolSize = size;
    return this;
  }
  minPoolSize(size) {
    this.poolConfig.minPoolSize = size;
    return this;
  }
  maxIdleTime(time) {
    this.poolConfig.maxIdleTime = time;
    return this;
  }
  waitTimeout(timeout) {
    this.poolConfig.waitTimeout = timeout;
    return this;
  }
  build() {
    return this.poolConfig;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigBuilder,
  DEFAULT_CONFIG,
  DEFAULT_POOL_CONFIG,
  PoolConfigBuilder,
  SQL_DIALECT_TABLE,
  SQL_DIALECT_TREE,
  parseNodeUrls
});
//# sourceMappingURL=Config.js.map
