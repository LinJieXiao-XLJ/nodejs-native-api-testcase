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
var ConcurrentExecutor_exports = {};
__export(ConcurrentExecutor_exports, {
  chunkArray: () => chunkArray,
  createSemaphore: () => createSemaphore,
  executeBatched: () => executeBatched,
  executeConcurrent: () => executeConcurrent
});
module.exports = __toCommonJS(ConcurrentExecutor_exports);
var import_Logger = require("./Logger");
async function executeConcurrent(items, operation, options) {
  const startTime = Date.now();
  if (items.length === 0) {
    return {
      results: [],
      durationMs: 0,
      successCount: 0,
      failureCount: 0,
      errors: []
    };
  }
  const concurrency = Math.min((options == null ? void 0 : options.concurrency) || 10, items.length);
  const stopOnError = (options == null ? void 0 : options.stopOnError) ?? false;
  const logProgressEvery = (options == null ? void 0 : options.logProgressEvery) ?? 0;
  const results = new Array(items.length);
  const errors = [];
  let itemIndex = 0;
  let completedCount = 0;
  let shouldStop = false;
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (!shouldStop && itemIndex < items.length) {
          const idx = itemIndex++;
          if (idx >= items.length) break;
          try {
            results[idx] = await operation(items[idx], idx);
            completedCount++;
            if (logProgressEvery > 0 && completedCount % logProgressEvery === 0) {
              const elapsed = Date.now() - startTime;
              const rate = completedCount / (elapsed / 1e3);
              import_Logger.logger.info(
                `[Progress] ${completedCount}/${items.length} (${rate.toFixed(2)} items/sec)`
              );
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            errors.push({ index: idx, error });
            if (stopOnError) {
              shouldStop = true;
              break;
            }
          }
        }
      })()
    );
  }
  await Promise.all(workers);
  const durationMs = Date.now() - startTime;
  return {
    results,
    durationMs,
    successCount: completedCount,
    failureCount: errors.length,
    errors
  };
}
async function executeBatched(items, batchSize, operation, options) {
  const startTime = Date.now();
  if (items.length === 0) {
    return {
      results: [],
      durationMs: 0,
      successCount: 0,
      failureCount: 0,
      errors: []
    };
  }
  const allResults = [];
  const allErrors = [];
  let totalSuccess = 0;
  let globalIndex = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchStartIndex = globalIndex;
    const batchResult = await executeConcurrent(
      batch,
      (item, idx) => operation(item, batchStartIndex + idx),
      { ...options, logProgressEvery: 0 }
      // Disable per-batch logging
    );
    allResults.push(...batchResult.results);
    totalSuccess += batchResult.successCount;
    for (const err of batchResult.errors) {
      allErrors.push({ index: batchStartIndex + err.index, error: err.error });
    }
    globalIndex += batch.length;
    if ((options == null ? void 0 : options.logProgressEvery) && options.logProgressEvery > 0) {
      import_Logger.logger.info(
        `[Batch] Completed ${Math.min(i + batchSize, items.length)}/${items.length} items`
      );
    }
    if ((options == null ? void 0 : options.stopOnError) && batchResult.errors.length > 0) {
      break;
    }
  }
  return {
    results: allResults,
    durationMs: Date.now() - startTime,
    successCount: totalSuccess,
    failureCount: allErrors.length,
    errors: allErrors
  };
}
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
function createSemaphore(limit) {
  let running = 0;
  const queue = [];
  return {
    async acquire() {
      if (running < limit) {
        running++;
        return;
      }
      return new Promise((resolve) => {
        queue.push(resolve);
      });
    },
    release() {
      const next = queue.shift();
      if (next) {
        next();
      } else {
        running--;
      }
    },
    get available() {
      return limit - running;
    },
    get waiting() {
      return queue.length;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chunkArray,
  createSemaphore,
  executeBatched,
  executeConcurrent
});
//# sourceMappingURL=ConcurrentExecutor.js.map
