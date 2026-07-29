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
var BufferPool_exports = {};
__export(BufferPool_exports, {
  BufferPool: () => BufferPool,
  globalBufferPool: () => globalBufferPool
});
module.exports = __toCommonJS(BufferPool_exports);
var import_Logger = require("./Logger");
const _BufferPool = class _BufferPool {
  constructor() {
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      allocations: 0,
      returns: 0
    };
    this.pools = /* @__PURE__ */ new Map();
    for (const size of _BufferPool.SIZE_CLASSES) {
      this.pools.set(size, []);
    }
  }
  /**
   * Get a buffer of at least the requested size
   * Returns a pooled buffer if available, otherwise allocates new
   * @throws Error if buffer allocation fails (e.g., out of memory)
   */
  acquire(minSize) {
    const sizeClass = this.getSizeClass(minSize);
    try {
      if (sizeClass === null) {
        this.stats.misses++;
        this.stats.allocations++;
        return Buffer.allocUnsafe(minSize);
      }
      const pool = this.pools.get(sizeClass);
      if (!pool) {
        this.stats.misses++;
        this.stats.allocations++;
        return Buffer.allocUnsafe(sizeClass);
      }
      const buffer = pool.pop();
      if (buffer) {
        this.stats.hits++;
        return buffer.subarray(0, minSize);
      } else {
        this.stats.misses++;
        this.stats.allocations++;
        return Buffer.allocUnsafe(sizeClass);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Buffer allocation failed for size ${minSize}: ${message}`);
    }
  }
  /**
   * Return a buffer to the pool for reuse
   * Only pools buffers that fit in size classes
   */
  release(buffer) {
    const sizeClass = this.getSizeClass(buffer.length);
    if (sizeClass === null) {
      return;
    }
    const pool = this.pools.get(sizeClass);
    if (!pool) {
      return;
    }
    if (pool.length < _BufferPool.MAX_BUFFERS_PER_CLASS) {
      if (buffer.length === sizeClass) {
        pool.push(buffer);
        this.stats.returns++;
      }
    }
  }
  /**
   * Find the appropriate size class for a requested size
   * Returns null if size is too large for pooling
   */
  getSizeClass(size) {
    for (const sizeClass of _BufferPool.SIZE_CLASSES) {
      if (size <= sizeClass) {
        return sizeClass;
      }
    }
    return null;
  }
  /**
   * Get pool statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : "0.00";
    const pooledBuffers = Array.from(this.pools.values()).reduce(
      (sum, pool) => sum + pool.length,
      0
    );
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      pooledBuffers
    };
  }
  /**
   * Clear all pooled buffers
   */
  clear() {
    for (const pool of this.pools.values()) {
      pool.length = 0;
    }
    import_Logger.logger.debug("BufferPool cleared");
  }
  /**
   * Log statistics (for debugging)
   */
  logStats() {
    const stats = this.getStats();
    import_Logger.logger.debug(`BufferPool stats: ${JSON.stringify(stats)}`);
  }
};
// Size classes: 1KB, 4KB, 16KB, 64KB, 256KB, 1MB, 4MB
_BufferPool.SIZE_CLASSES = [
  1024,
  // 1KB
  4096,
  // 4KB
  16384,
  // 16KB
  65536,
  // 64KB
  262144,
  // 256KB
  1048576,
  // 1MB
  4194304
  // 4MB
];
// Maximum buffers per size class
_BufferPool.MAX_BUFFERS_PER_CLASS = 10;
let BufferPool = _BufferPool;
const globalBufferPool = new BufferPool();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BufferPool,
  globalBufferPool
});
//# sourceMappingURL=BufferPool.js.map
