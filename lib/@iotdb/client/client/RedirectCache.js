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
var RedirectCache_exports = {};
__export(RedirectCache_exports, {
  RedirectCache: () => RedirectCache
});
module.exports = __toCommonJS(RedirectCache_exports);
var import_Logger = require("../utils/Logger");
class RedirectCache {
  constructor(ttl = 3e5, maxSize = 1e4) {
    this.deviceToEndpoint = /* @__PURE__ */ new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }
  /**
   * Get cached endpoint for a device.
   * Returns null if not cached or expired.
   */
  get(deviceId) {
    const entry = this.deviceToEndpoint.get(deviceId);
    if (!entry) {
      return null;
    }
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.deviceToEndpoint.delete(deviceId);
      import_Logger.logger.debug(`Redirect cache expired for device: ${deviceId}`);
      return null;
    }
    return entry.endpoint;
  }
  /**
   * Cache endpoint for a device.
   */
  set(deviceId, endpoint) {
    const exists = this.deviceToEndpoint.has(deviceId);
    if (exists) {
      this.deviceToEndpoint.delete(deviceId);
    }
    if (!exists && this.deviceToEndpoint.size >= this.maxSize) {
      const firstKey = this.deviceToEndpoint.keys().next().value;
      if (firstKey) {
        this.deviceToEndpoint.delete(firstKey);
        import_Logger.logger.debug(`Evicted oldest redirect cache entry: ${firstKey}`);
      }
    }
    this.deviceToEndpoint.set(deviceId, {
      endpoint,
      timestamp: Date.now()
    });
    import_Logger.logger.debug(
      `Cached redirect: ${deviceId} -> ${endpoint.host}:${endpoint.port}`
    );
  }
  /**
   * Remove cached endpoint for a device.
   */
  remove(deviceId) {
    this.deviceToEndpoint.delete(deviceId);
    import_Logger.logger.debug(`Removed redirect cache for device: ${deviceId}`);
  }
  /**
   * Clear all cached mappings.
   */
  clear() {
    this.deviceToEndpoint.clear();
    import_Logger.logger.debug("Cleared all redirect cache entries");
  }
  /**
   * Get cache statistics.
   */
  getStats() {
    return {
      size: this.deviceToEndpoint.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RedirectCache
});
//# sourceMappingURL=RedirectCache.js.map
