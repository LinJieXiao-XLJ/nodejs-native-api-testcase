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
var TableSession_exports = {};
__export(TableSession_exports, {
  TableSession: () => TableSession
});
module.exports = __toCommonJS(TableSession_exports);
var import_Session = require("./Session");
var import_Logger = require("../utils/Logger");
class TableSession extends import_Session.Session {
  /**
   * Execute non-query statement with database context tracking
   * Similar to Java Session implementation:
   * - Tracks database changes from USE statements
   * - Logs warnings for context switches (simplified version)
   *
   * @param sql - SQL statement to execute
   */
  async executeNonQueryStatement(sql) {
    const previousDatabase = this.currentDatabase;
    await super.executeNonQueryStatement(sql);
    const usePattern = /^\s*USE\s+([a-zA-Z0-9_.-]+)\s*;?\s*$/i;
    const match = sql.match(usePattern);
    if (match) {
      this.currentDatabase = match[1];
      import_Logger.logger.debug(
        `Database context changed from ${previousDatabase || "none"} to ${this.currentDatabase}`
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TableSession
});
//# sourceMappingURL=TableSession.js.map
