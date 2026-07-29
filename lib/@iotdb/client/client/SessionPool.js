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
var SessionPool_exports = {};
__export(SessionPool_exports, {
  SessionPool: () => SessionPool
});
module.exports = __toCommonJS(SessionPool_exports);
var import_Session = require("./Session");
var import_Config = require("../utils/Config");
var import_BaseSessionPool = require("./BaseSessionPool");
class SessionPool extends import_BaseSessionPool.BaseSessionPool {
  constructor(hostsOrConfig, port, config) {
    super(hostsOrConfig, port, config);
  }
  getPoolName() {
    return "SessionPool";
  }
  async createPoolSession() {
    const endPoint = this.getNextEndPoint();
    const internalConfig = {
      ...this.config,
      host: endPoint.host,
      port: endPoint.port,
      sqlDialect: import_Config.SQL_DIALECT_TREE
    };
    const session = new import_Session.Session(internalConfig);
    await session.open();
    return session;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SessionPool
});
//# sourceMappingURL=SessionPool.js.map
