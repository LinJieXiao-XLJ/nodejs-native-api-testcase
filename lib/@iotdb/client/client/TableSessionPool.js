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
var TableSessionPool_exports = {};
__export(TableSessionPool_exports, {
  TableSession: () => import_TableSession2.TableSession,
  TableSessionPool: () => TableSessionPool
});
module.exports = __toCommonJS(TableSessionPool_exports);
var import_TableSession = require("./TableSession");
var import_Config = require("../utils/Config");
var import_BaseSessionPool = require("./BaseSessionPool");
var import_Logger = require("../utils/Logger");
var import_TableSession2 = require("./TableSession");
class TableSessionPool extends import_BaseSessionPool.BaseSessionPool {
  // Track database context across pool (table model only)
  constructor(hostsOrConfig, port, config) {
    super(hostsOrConfig, port, config);
  }
  getPoolName() {
    return "TableSessionPool";
  }
  async createPoolSession() {
    const endPoint = this.getNextEndPoint();
    const internalConfig = {
      ...this.config,
      host: endPoint.host,
      port: endPoint.port,
      sqlDialect: import_Config.SQL_DIALECT_TABLE
    };
    try {
      const session = new import_TableSession.TableSession(internalConfig);
      await session.open();
      if (this.currentDatabase) {
        try {
          await session.executeNonQueryStatement(`USE ${this.currentDatabase}`);
          import_Logger.logger.debug(
            `Applied database context ${this.currentDatabase} to new session`
          );
        } catch (error) {
          import_Logger.logger.warn(
            `Failed to apply database context to new session: ${error.message}`
          );
        }
      }
      if (!this.currentDatabase && this.config.database) {
        try {
          import_Logger.logger.debug(`Attempting to USE database: ${this.config.database}`);
          await session.executeNonQueryStatement(`USE ${this.config.database}`);
          this.currentDatabase = this.config.database;
          import_Logger.logger.debug(
            `Successfully set database context to: ${this.config.database}`
          );
        } catch (error) {
          import_Logger.logger.debug(
            `Failed to USE database ${this.config.database}, ignoring error: ${error.message}`
          );
        }
      }
      return session;
    } catch (error) {
      const errorMsg = `Failed to create pool session for ${endPoint.host}:${endPoint.port} - ${error.message}`;
      throw new Error(errorMsg);
    }
  }
  /**
   * Override executeNonQueryStatement to track USE statements and sync database context
   * This is specific to table model - tree model doesn't need this
   */
  async executeNonQueryStatement(sql) {
    const session = await this.getSession();
    try {
      await session.executeNonQueryStatement(sql);
      const usePattern = /^\s*USE\s+([a-zA-Z0-9_.-]+)\s*;?\s*$/i;
      const match = sql.match(usePattern);
      if (match) {
        const newDatabase = match[1];
        const previousDatabase = this.currentDatabase;
        this.currentDatabase = newDatabase;
        import_Logger.logger.debug(
          `Pool database context changed from ${previousDatabase || "none"} to ${this.currentDatabase}`
        );
        await this.syncDatabaseContextToPool(newDatabase);
      }
    } finally {
      this.releaseSession(session);
    }
  }
  /**
   * Synchronize database context to all idle sessions in the pool
   * This ensures all sessions use the same database after a USE statement
   * Only applies to table model - tree model doesn't need this
   * @param database - Database name to switch to
   */
  async syncDatabaseContextToPool(database) {
    const syncPromises = this.pool.filter((ps) => !ps.inUse).map(async (ps) => {
      try {
        await ps.session.executeNonQueryStatement(`USE ${database}`);
        import_Logger.logger.debug(`Synced database context to idle session`);
      } catch (error) {
        import_Logger.logger.warn(`Failed to sync database context to session: ${error}`);
      }
    });
    await Promise.all(syncPromises);
  }
  /**
   * Override getSession to return session from pool
   * 
   * Database context is managed through a two-step process:
   * 1. During session creation (createPoolSession), the session gets the current database context
   * 2. When executeNonQueryStatement detects a USE statement, syncDatabaseContextToPool() is called
   *    to synchronize the new database context to all idle sessions in the pool
   * 
   * This ensures all sessions maintain correct database context without needing to execute USE
   * on every getSession() call, which significantly improves performance in high-concurrency scenarios.
   */
  async getSession() {
    return super.getSession();
  }
  /**
   * Get current database context
   * @returns Current database name or undefined
   */
  getCurrentDatabase() {
    return this.currentDatabase;
  }
  // insertTablet is inherited from BaseSessionPool.
  // Previously this class had a simpler override that:
  // 1. Did not include [PERF] debug logging for performance analysis
  // 2. Did not support redirection cache for optimal write routing
  // 3. Had less detailed timing metrics for session acquisition vs insert operation
  // The inherited method from BaseSessionPool provides all these features.
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TableSession,
  TableSessionPool
});
//# sourceMappingURL=TableSessionPool.js.map
