"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var BaseSessionPool_exports = {};
__export(BaseSessionPool_exports, {
  BaseSessionPool: () => BaseSessionPool
});
module.exports = __toCommonJS(BaseSessionPool_exports);
var import_Config = require("../utils/Config");
var import_Logger = require("../utils/Logger");
var import_ProcessCleanup = require("../utils/ProcessCleanup");
var import_RedirectCache = require("./RedirectCache");
var import_denque = __toESM(require("denque"));
class BaseSessionPool {
  constructor(hostsOrConfig, port, config) {
    this.pool = [];
    this.waitQueue = new import_denque.default();
    this.idleSessions = new import_denque.default();
    this.activeSessions = /* @__PURE__ */ new Set();
    this.currentEndPointIndex = 0;
    this.cleanupInterval = null;
    this.endPointToSession = /* @__PURE__ */ new Map();
    if (typeof hostsOrConfig === "object" && !Array.isArray(hostsOrConfig)) {
      const poolConfig = hostsOrConfig;
      this.config = { ...import_Config.DEFAULT_POOL_CONFIG, ...poolConfig };
      if (poolConfig.nodeUrls) {
        if (poolConfig.nodeUrls.length === 0) {
          throw new Error("nodeUrls array cannot be empty");
        }
        this.endPoints = typeof poolConfig.nodeUrls[0] === "string" ? (0, import_Config.parseNodeUrls)(poolConfig.nodeUrls) : poolConfig.nodeUrls;
      } else if (poolConfig.host && poolConfig.port) {
        this.endPoints = [{ host: poolConfig.host, port: poolConfig.port }];
      } else {
        throw new Error(
          "Either nodeUrls or host/port must be provided in config"
        );
      }
    } else {
      if (port === void 0) {
        throw new Error(
          "Port must be provided when using host-based constructor"
        );
      }
      this.config = { ...import_Config.DEFAULT_POOL_CONFIG, ...config, port };
      const hostList = Array.isArray(hostsOrConfig) ? hostsOrConfig : [hostsOrConfig];
      this.endPoints = hostList.map((host) => ({ host, port }));
    }
    this.redirectCache = new import_RedirectCache.RedirectCache(
      this.config.redirectCacheTTL || 3e5,
      1e4
      // max size
    );
    import_Logger.logger.info(
      `${this.getPoolName()} created with ${this.endPoints.length} endpoints, max pool size: ${this.config.maxPoolSize}, redirection: ${this.config.enableRedirection ? "enabled" : "disabled"}`
    );
    (0, import_ProcessCleanup.registerClosable)(this);
  }
  async init() {
    const minSize = this.config.minPoolSize || 1;
    try {
      await Promise.all(
        Array.from({ length: minSize }, () => this.createSession())
      );
    } catch (error) {
      const errorMsg = `Failed to initialize pool: ${error.message}`;
      import_Logger.logger.error(errorMsg);
      if (error.stack) {
        import_Logger.logger.error(`Stack trace: ${error.stack}`);
      }
      throw new Error(errorMsg);
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSessions().catch((error) => {
        import_Logger.logger.error("Error during scheduled session cleanup:", error);
      });
    }, 3e4).unref();
    import_Logger.logger.info(`${this.getPoolName()} initialized with ${minSize} sessions`);
  }
  async createSession() {
    const session = await this.createPoolSession();
    const pooledSession = {
      session,
      lastUsed: Date.now(),
      inUse: false
    };
    this.pool.push(pooledSession);
    this.idleSessions.push(pooledSession);
    return session;
  }
  getNextEndPoint() {
    const endPoint = this.endPoints[this.currentEndPointIndex];
    this.currentEndPointIndex = (this.currentEndPointIndex + 1) % this.endPoints.length;
    return endPoint;
  }
  /**
   * Extract device ID from tablet for caching
   */
  extractDeviceId(tablet) {
    if ("deviceId" in tablet) {
      return tablet.deviceId;
    } else if ("tableName" in tablet) {
      return tablet.tableName;
    }
    throw new Error("Unable to extract device ID from tablet");
  }
  /**
   * Get or create a session for a specific endpoint
   */
  async getSessionForEndpoint(endpoint) {
    const key = `${endpoint.host}:${endpoint.port}`;
    let pooledSession = this.endPointToSession.get(key);
    if (pooledSession && pooledSession.session.isOpen()) {
      pooledSession.inUse = true;
      pooledSession.lastUsed = Date.now();
      return pooledSession.session;
    }
    const session = await this.createPoolSession();
    pooledSession = {
      session,
      lastUsed: Date.now(),
      inUse: true
    };
    this.endPointToSession.set(key, pooledSession);
    this.pool.push(pooledSession);
    import_Logger.logger.info(
      `Created new session for redirect endpoint: ${endpoint.host}:${endpoint.port}`
    );
    return session;
  }
  /**
   * Get a session from the pool
   * The session must be released back to the pool using releaseSession() after use
   */
  async getSession() {
    const startTime = Date.now();
    const pooledSession = this.idleSessions.shift();
    if (pooledSession) {
      if (pooledSession.session.isOpen()) {
        this.activeSessions.add(pooledSession);
        pooledSession.lastUsed = Date.now();
        const duration = Date.now() - startTime;
        import_Logger.logger.debug(
          `[PERF] getSession (reuse): ${duration}ms, pool: ${this.pool.length}, available: ${this.getAvailableSize()}, inUse: ${this.getInUseSize()}`
        );
        return pooledSession.session;
      } else {
        const index = this.pool.indexOf(pooledSession);
        if (index > -1) {
          this.pool.splice(index, 1);
        }
      }
    }
    if (this.pool.length < (this.config.maxPoolSize || 10)) {
      import_Logger.logger.debug(
        `[PERF] getSession creating new session, pool: ${this.pool.length}/${this.config.maxPoolSize || 10}`
      );
      const session = await this.createSession();
      const pooledSession2 = this.pool.find((ps) => ps.session === session);
      if (pooledSession2) {
        this.idleSessions.shift();
        this.activeSessions.add(pooledSession2);
        pooledSession2.inUse = true;
      }
      const duration = Date.now() - startTime;
      import_Logger.logger.debug(`[PERF] getSession (new): ${duration}ms`);
      return session;
    }
    import_Logger.logger.debug(
      `[PERF] getSession waiting, pool full: ${this.pool.length}, waitQueue: ${this.waitQueue.length}`
    );
    const waitTimeout = this.config.waitTimeout || 6e4;
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const waiters = this.waitQueue.toArray();
        const index = waiters.indexOf(resolve);
        if (index > -1) {
          this.waitQueue.remove(index, 1);
        }
        reject(new Error("Timeout waiting for available session"));
      }, waitTimeout);
      if (typeof timeoutId === "object" && "unref" in timeoutId) {
        timeoutId.unref();
      }
      this.waitQueue.push((session) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        import_Logger.logger.debug(`[PERF] getSession (waited): ${duration}ms`);
        resolve(session);
      });
    });
  }
  /**
   * Release a session back to the pool
   * Should be called after getSession() when the session is no longer needed
   */
  releaseSession(session) {
    const pooledSession = this.pool.find((ps) => ps.session === session);
    if (pooledSession) {
      this.activeSessions.delete(pooledSession);
      pooledSession.inUse = false;
      pooledSession.lastUsed = Date.now();
      if (this.waitQueue.length > 0) {
        const waiter = this.waitQueue.shift();
        if (waiter) {
          this.activeSessions.add(pooledSession);
          pooledSession.inUse = true;
          waiter(session);
        } else {
          this.idleSessions.push(pooledSession);
        }
      } else {
        this.idleSessions.push(pooledSession);
      }
    }
  }
  async cleanupIdleSessions() {
    const now = Date.now();
    const maxIdleTime = this.config.maxIdleTime || 6e4;
    const minSize = this.config.minPoolSize || 1;
    const sessionsToRemove = [];
    const idleArray = this.idleSessions.toArray();
    for (const ps of idleArray) {
      if (now - ps.lastUsed > maxIdleTime && this.pool.length > minSize) {
        sessionsToRemove.push(ps);
      }
    }
    await Promise.all(
      sessionsToRemove.map(async (ps) => {
        try {
          await ps.session.close();
          const poolIndex = this.pool.indexOf(ps);
          if (poolIndex > -1) {
            this.pool.splice(poolIndex, 1);
          }
          const idleIndex = this.idleSessions.toArray().indexOf(ps);
          if (idleIndex > -1) {
            this.idleSessions.remove(idleIndex, 1);
          }
          import_Logger.logger.debug(`Removed idle session from ${this.getPoolName()}`);
        } catch (error) {
          import_Logger.logger.error("Error closing idle session:", error);
        }
      })
    );
  }
  /**
   * Execute a query statement and return SessionDataSet
   * Session is held until dataset.close() is called
   */
  async executeQueryStatement(sql, timeoutMs = 6e4) {
    const session = await this.getSession();
    try {
      const dataSet = await session.executeQueryStatement(sql, timeoutMs);
      dataSet.setCleanupCallback(() => {
        this.releaseSession(session);
      });
      return dataSet;
    } catch (error) {
      this.releaseSession(session);
      throw error;
    }
  }
  async executeNonQueryStatement(sql) {
    const session = await this.getSession();
    try {
      return await session.executeNonQueryStatement(sql);
    } finally {
      this.releaseSession(session);
    }
  }
  /**
   * Insert tablet (supports both tree and table models)
   * @param tablet TreeTablet for tree model or TableTablet for table model
   */
  async insertTablet(tablet) {
    const totalStartTime = Date.now();
    const deviceId = this.extractDeviceId(tablet);
    const cachedEndpoint = this.config.enableRedirection ? this.redirectCache.get(deviceId) : null;
    const sessionStartTime = Date.now();
    let session;
    if (cachedEndpoint) {
      session = await this.getSessionForEndpoint(cachedEndpoint);
    } else {
      session = await this.getSession();
    }
    const sessionDuration = Date.now() - sessionStartTime;
    try {
      const insertStartTime = Date.now();
      await session.insertTablet(tablet);
      const insertDuration = Date.now() - insertStartTime;
      const totalDuration = Date.now() - totalStartTime;
      import_Logger.logger.debug(
        `[PERF] Pool insertTablet total: ${totalDuration}ms (session: ${sessionDuration}ms, insert: ${insertDuration}ms)`
      );
      if (this.config.enableRedirection) {
        const redirectEndpoint = session.getAndClearLastRedirect();
        if (redirectEndpoint) {
          this.redirectCache.set(deviceId, redirectEndpoint);
          import_Logger.logger.info(
            `Cached redirect recommendation: ${deviceId} -> ${redirectEndpoint.host}:${redirectEndpoint.port}`
          );
        }
      }
    } finally {
      this.releaseSession(session);
    }
  }
  async close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    await Promise.all(
      this.pool.map(async (ps) => {
        try {
          await ps.session.close();
        } catch (error) {
          import_Logger.logger.error("Error closing session:", error);
        }
      })
    );
    this.pool = [];
    this.idleSessions.clear();
    this.activeSessions.clear();
    this.waitQueue.clear();
    this.endPointToSession.clear();
    this.redirectCache.clear();
    (0, import_ProcessCleanup.unregisterClosable)(this);
    import_Logger.logger.info(`${this.getPoolName()} closed`);
  }
  getPoolSize() {
    return this.pool.length;
  }
  getAvailableSize() {
    return this.idleSessions.length;
  }
  getInUseSize() {
    return this.activeSessions.size;
  }
  /**
   * Get total number of sessions in the pool
   * @alias getPoolSize
   */
  get totalCount() {
    return this.pool.length;
  }
  /**
   * Get number of idle sessions
   * @alias getAvailableSize
   */
  get idleCount() {
    return this.idleSessions.length;
  }
  /**
   * Get number of active (in-use) sessions
   * @alias getInUseSize
   */
  get activeCount() {
    return this.activeSessions.size;
  }
  /**
   * Get number of requests waiting for a session
   */
  get waitingCount() {
    return this.waitQueue.length;
  }
  /**
   * Get comprehensive pool statistics
   */
  getPoolStats() {
    return {
      total: this.totalCount,
      idle: this.idleCount,
      active: this.activeCount,
      waiting: this.waitingCount,
      endpoints: this.endPoints.length,
      redirectCacheSize: this.redirectCache.getStats().size
    };
  }
  /**
   * Insert multiple tablets concurrently using the pool.
   * This method optimizes for Node.js async patterns by:
   * 1. Pre-acquiring sessions to avoid contention
   * 2. Distributing tablets across sessions for parallel execution
   * 3. Automatically releasing sessions after completion
   * 
   * This is the recommended way to achieve high throughput in Node.js.
   * 
   * @param tablets Array of tablets to insert
   * @param options Configuration options
   * @param options.concurrency Number of concurrent workers (default: pool size or 10)
   * @returns Promise that resolves when all inserts complete
   * 
   * @example
   * ```typescript
   * const tablets = generateTablets(1000);
   * // Insert 1000 tablets using pool's concurrent execution
   * await pool.insertTabletsParallel(tablets, { concurrency: 20 });
   * ```
   */
  async insertTabletsParallel(tablets, options) {
    if (tablets.length === 0) {
      return;
    }
    const concurrency = Math.min(
      (options == null ? void 0 : options.concurrency) || this.config.maxPoolSize || 10,
      tablets.length
    );
    const totalStartTime = Date.now();
    import_Logger.logger.debug(
      `[PERF] Pool insertTabletsParallel START: ${tablets.length} tablets, concurrency: ${concurrency}`
    );
    const sessions = [];
    try {
      for (let i = 0; i < concurrency; i++) {
        sessions.push(await this.getSession());
      }
    } catch (error) {
      for (const session of sessions) {
        this.releaseSession(session);
      }
      throw error;
    }
    const errors = [];
    let tabletIndex = 0;
    try {
      const workers = sessions.map(async (session) => {
        while (tabletIndex < tablets.length) {
          const idx = tabletIndex++;
          if (idx >= tablets.length) break;
          const tablet = tablets[idx];
          try {
            await session.insertTablet(tablet);
          } catch (err) {
            errors.push({
              index: idx,
              error: err instanceof Error ? err : new Error(String(err))
            });
          }
        }
      });
      await Promise.all(workers);
    } finally {
      for (const session of sessions) {
        this.releaseSession(session);
      }
    }
    const totalDuration = Date.now() - totalStartTime;
    const throughput = tablets.length / (totalDuration / 1e3);
    import_Logger.logger.debug(
      `[PERF] Pool insertTabletsParallel COMPLETE: ${totalDuration}ms, ${throughput.toFixed(2)} tablets/sec`
    );
    if (errors.length > 0) {
      const failedIndices = errors.map((e) => e.index);
      const errorDetails = errors.slice(0, 5).map((e) => `[${e.index}]: ${e.error.message}`).join("; ");
      const suffix = errors.length > 5 ? ` ... and ${errors.length - 5} more` : "";
      const aggregateError = new Error(
        `${errors.length} of ${tablets.length} tablet inserts failed. Failed indices: [${failedIndices.join(", ")}]. Errors: ${errorDetails}${suffix}`
      );
      aggregateError.failedIndices = failedIndices;
      aggregateError.errors = errors.map((e) => e.error);
      throw aggregateError;
    }
  }
  /**
   * Execute multiple operations concurrently using the pool.
   * This is a generic utility for running any async operations in parallel
   * while respecting pool size limits.
   * 
   * @param items Array of items to process
   * @param operation Async function to execute for each item
   * @param options Configuration options
   * @param options.concurrency Number of concurrent workers (default: pool size or 10)
   * @param options.stopOnError Whether to stop processing on first error (default: false)
   * @returns Results array (in same order as input items).
   *          Note: When stopOnError=false, failed operations will have `undefined` at their index.
   *          Check array entries for undefined to detect failures.
   * 
   * @example
   * ```typescript
   * const devices = ['d1', 'd2', 'd3'];
   * const results = await pool.executeParallel(
   *   devices,
   *   async (session, deviceId) => {
   *     await session.executeNonQueryStatement(`CREATE TIMESERIES root.sg.${deviceId}...`);
   *     return deviceId;
   *   },
   *   { concurrency: 5 }
   * );
   * // Check for failures
   * const failures = results.filter((r, i) => r === undefined);
   * ```
   */
  async executeParallel(items, operation, options) {
    if (items.length === 0) {
      return [];
    }
    const concurrency = Math.min(
      (options == null ? void 0 : options.concurrency) || this.config.maxPoolSize || 10,
      items.length
    );
    const stopOnError = (options == null ? void 0 : options.stopOnError) ?? false;
    const sessions = [];
    try {
      for (let i = 0; i < concurrency; i++) {
        sessions.push(await this.getSession());
      }
    } catch (error) {
      for (const session of sessions) {
        this.releaseSession(session);
      }
      throw error;
    }
    const results = new Array(items.length);
    let itemIndex = 0;
    let shouldStop = false;
    const errors = [];
    try {
      const workers = sessions.map(async (session) => {
        while (!shouldStop && itemIndex < items.length) {
          const idx = itemIndex++;
          if (idx >= items.length) break;
          try {
            results[idx] = await operation(session, items[idx], idx);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            errors.push({ index: idx, error });
            if (stopOnError) {
              shouldStop = true;
              break;
            }
          }
        }
      });
      await Promise.all(workers);
    } finally {
      for (const session of sessions) {
        this.releaseSession(session);
      }
    }
    if (errors.length > 0 && stopOnError) {
      throw errors[0].error;
    }
    return results;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseSessionPool
});
//# sourceMappingURL=BaseSessionPool.js.map
