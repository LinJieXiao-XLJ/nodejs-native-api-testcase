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
var Logger_exports = {};
__export(Logger_exports, {
  LogLevel: () => LogLevel,
  logger: () => logger
});
module.exports = __toCommonJS(Logger_exports);
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
class Logger {
  constructor() {
    var _a;
    const envLevel = (_a = process.env.LOG_LEVEL) == null ? void 0 : _a.toUpperCase();
    this.level = envLevel && envLevel in LogLevel ? LogLevel[envLevel] : 1 /* INFO */;
  }
  setLevel(level) {
    this.level = level;
  }
  debug(message, ...args) {
    if (this.level <= 0 /* DEBUG */) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  info(message, ...args) {
    if (this.level <= 1 /* INFO */) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }
  warn(message, ...args) {
    if (this.level <= 2 /* WARN */) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  error(message, ...args) {
    if (this.level <= 3 /* ERROR */) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}
const logger = new Logger();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LogLevel,
  logger
});
//# sourceMappingURL=Logger.js.map
