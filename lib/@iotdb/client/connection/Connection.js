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
var Connection_exports = {};
__export(Connection_exports, {
  Connection: () => Connection
});
module.exports = __toCommonJS(Connection_exports);
var thrift = __toESM(require("thrift"));
var import_Logger = require("../utils/Logger");
const IClientRPCService = require("../thrift/generated/IClientRPCService");
const ttypes = require("../thrift/generated/client_types");
class Connection {
  constructor(config) {
    this.connection = null;
    this.client = null;
    this.sessionId = null;
    this.statementId = null;
    this.isConnected = false;
    this.config = config;
  }
  async open() {
    try {
      if (!this.config.host || !this.config.port) {
        throw new Error("Host and port are required for connection");
      }
      const options = {
        transport: thrift.TFramedTransport,
        protocol: thrift.TBinaryProtocol,
        path: void 0,
        headers: void 0,
        https: this.config.enableSSL,
        debug: false,
        max_attempts: void 0,
        retry_max_delay: void 0,
        connect_timeout: void 0,
        timeout: void 0,
        ...this.config.sslOptions
      };
      if (this.config.enableSSL) {
        this.connection = thrift.createSSLConnection(
          this.config.host,
          this.config.port,
          {
            ...options,
            ...this.config.sslOptions
          }
        );
      } else {
        this.connection = thrift.createConnection(
          this.config.host,
          this.config.port,
          options
        );
      }
      this.connection.on("error", (err) => {
        import_Logger.logger.error("Connection error:", err);
        this.isConnected = false;
      });
      this.connection.on("close", () => {
        import_Logger.logger.debug("Connection closed");
        this.isConnected = false;
      });
      this.client = thrift.createClient(IClientRPCService, this.connection);
      await this.openSession();
      await this.requestStatementId();
      this.isConnected = true;
    } catch (error) {
      import_Logger.logger.error("Failed to connect:", error);
      throw error;
    }
  }
  async openSession() {
    const configuration = {};
    if (this.config.sqlDialect) {
      configuration["sql_dialect"] = this.config.sqlDialect;
    } else {
      import_Logger.logger.warn(
        "No sql_dialect specified, IoTDB will use default (tree model)"
      );
    }
    import_Logger.logger.debug(
      `Opening session with configuration: ${JSON.stringify(configuration)}`
    );
    const openReq = new ttypes.TSOpenSessionReq({
      client_protocol: ttypes.TSProtocolVersion.IOTDB_SERVICE_PROTOCOL_V3,
      username: this.config.username || "root",
      password: this.config.password || "root",
      zoneId: this.config.timezone || "UTC+8",
      configuration
    });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("openSession timeout after 30 seconds"));
      }, 3e4);
      this.client.openSession(openReq, (err, response) => {
        clearTimeout(timeout);
        if (err) {
          import_Logger.logger.error(`openSession error: ${err.message}`);
          reject(err);
          return;
        }
        if (response.status.code !== 200) {
          const errorMsg = response.status.message || "Failed to open session";
          import_Logger.logger.error(
            `openSession failed with status ${response.status.code}: ${errorMsg}`
          );
          reject(new Error(errorMsg));
          return;
        }
        this.sessionId = response.sessionId;
        resolve();
      });
    });
  }
  async requestStatementId() {
    if (!this.sessionId) {
      throw new Error("Session not open");
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("requestStatementId timeout after 30 seconds"));
      }, 3e4);
      this.client.requestStatementId(
        this.sessionId,
        (err, statementId) => {
          clearTimeout(timeout);
          if (err) {
            import_Logger.logger.error(`requestStatementId error: ${err.message}`);
            reject(err);
            return;
          }
          this.statementId = statementId;
          resolve();
        }
      );
    });
  }
  async close() {
    if (!this.isConnected && !this.connection) {
      return;
    }
    try {
      if (this.sessionId) {
        const closeReq = new ttypes.TSCloseSessionReq({
          sessionId: this.sessionId
        });
        let timeoutHandle = null;
        await Promise.race([
          new Promise((resolve, reject) => {
            this.client.closeSession(closeReq, (err, _response) => {
              if (timeoutHandle) {
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
              }
              if (err) {
                reject(err);
                return;
              }
              resolve();
            });
          }),
          new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
              reject(new Error("Close session timeout"));
            }, 5e3);
            if (timeoutHandle && typeof timeoutHandle === "object" && "unref" in timeoutHandle) {
              timeoutHandle.unref();
            }
          })
        ]).catch((error) => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
          import_Logger.logger.warn("Error closing session:", error);
        });
        this.sessionId = null;
      }
      this.isConnected = false;
      if (this.connection) {
        this.connection.removeAllListeners();
        if (typeof this.connection.destroy === "function") {
          this.connection.destroy();
        } else {
          this.connection.end();
        }
        this.connection = null;
      }
      this.client = null;
      import_Logger.logger.debug("Connection closed");
    } catch (error) {
      import_Logger.logger.warn("Error closing connection:", error);
      this.sessionId = null;
      this.isConnected = false;
      if (this.connection) {
        this.connection.removeAllListeners();
        if (typeof this.connection.destroy === "function") {
          this.connection.destroy();
        }
        this.connection = null;
      }
      this.client = null;
    }
  }
  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error("Connection is not open");
    }
    return this.client;
  }
  getSessionId() {
    if (!this.sessionId) {
      throw new Error("Session is not open");
    }
    return this.sessionId;
  }
  getStatementId() {
    if (!this.statementId) {
      throw new Error("Statement ID not available");
    }
    return this.statementId;
  }
  isOpen() {
    return this.isConnected && this.sessionId !== null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Connection
});
//# sourceMappingURL=Connection.js.map
