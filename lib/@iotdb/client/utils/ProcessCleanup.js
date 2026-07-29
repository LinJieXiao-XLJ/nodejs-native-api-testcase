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
var ProcessCleanup_exports = {};
__export(ProcessCleanup_exports, {
  enableGlobalCleanup: () => enableGlobalCleanup,
  registerClosable: () => registerClosable,
  unregisterClosable: () => unregisterClosable
});
module.exports = __toCommonJS(ProcessCleanup_exports);
var import_Logger = require("./Logger");
const closables = /* @__PURE__ */ new Set();
let cleanupInProgress = null;
function registerClosable(closable) {
  closables.add(closable);
}
function unregisterClosable(closable) {
  closables.delete(closable);
}
async function runCleanup(timeoutMs) {
  if (!cleanupInProgress) {
    const cleanupPromise = Promise.allSettled(
      Array.from(closables).map((closable) => closable.close())
    ).then(() => void 0);
    if (timeoutMs > 0) {
      cleanupInProgress = Promise.race([
        cleanupPromise,
        new Promise((resolve) => {
          setTimeout(() => resolve(), timeoutMs);
        })
      ]).then(() => void 0);
    } else {
      cleanupInProgress = cleanupPromise;
    }
  }
  await cleanupInProgress;
}
function enableGlobalCleanup(options = {}) {
  const {
    signals = ["SIGINT", "SIGTERM"],
    includeBeforeExit = true,
    includeUncaughtException = true,
    includeUnhandledRejection = true,
    timeoutMs = 5e3
  } = options;
  const handlers = [];
  const attach = (event, handler) => {
    process.on(event, handler);
    handlers.push({ event, handler });
  };
  if (includeBeforeExit) {
    attach("beforeExit", async () => {
      try {
        await runCleanup(timeoutMs);
      } catch (error) {
        import_Logger.logger.warn("Error during beforeExit cleanup:", error);
      }
    });
  }
  if (includeUnhandledRejection) {
    attach("unhandledRejection", async (reason) => {
      import_Logger.logger.warn("Unhandled promise rejection:", reason);
      try {
        await runCleanup(timeoutMs);
      } finally {
        process.exit(1);
      }
    });
  }
  if (includeUncaughtException) {
    attach("uncaughtException", async (error) => {
      import_Logger.logger.error("Uncaught exception:", error);
      try {
        await runCleanup(timeoutMs);
      } finally {
        process.exit(1);
      }
    });
  }
  for (const signal of signals) {
    attach(signal, async () => {
      try {
        await runCleanup(timeoutMs);
      } finally {
        process.exit(0);
      }
    });
  }
  return () => {
    for (const { event, handler } of handlers) {
      process.off(event, handler);
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enableGlobalCleanup,
  registerClosable,
  unregisterClosable
});
//# sourceMappingURL=ProcessCleanup.js.map
