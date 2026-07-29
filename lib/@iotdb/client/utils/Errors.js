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
var Errors_exports = {};
__export(Errors_exports, {
  RedirectException: () => RedirectException,
  TSStatusCode: () => TSStatusCode
});
module.exports = __toCommonJS(Errors_exports);
class RedirectException extends Error {
  constructor(deviceId, endpoint, message) {
    super(
      message || `Redirect recommended for device ${deviceId} to ${endpoint.host}:${endpoint.port}`
    );
    this.name = "RedirectException";
    this.deviceId = deviceId;
    this.endpoint = endpoint;
  }
  /**
   * Create RedirectException from Thrift status response
   * @param status - Thrift status object
   * @param deviceId - Device ID being inserted
   * @returns RedirectException or null if not a redirect status
   */
  static fromThriftStatus(status, deviceId) {
    if (status.code === 400 && status.redirectNode) {
      return new RedirectException(
        deviceId,
        {
          host: status.redirectNode.internalIp || status.redirectNode.ip,
          port: status.redirectNode.port
        },
        status.message
      );
    }
    return null;
  }
}
var TSStatusCode = /* @__PURE__ */ ((TSStatusCode2) => {
  TSStatusCode2[TSStatusCode2["SUCCESS_STATUS"] = 200] = "SUCCESS_STATUS";
  TSStatusCode2[TSStatusCode2["STILL_EXECUTING_STATUS"] = 201] = "STILL_EXECUTING_STATUS";
  TSStatusCode2[TSStatusCode2["INVALID_HANDLE_STATUS"] = 202] = "INVALID_HANDLE_STATUS";
  TSStatusCode2[TSStatusCode2["INCOMPATIBLE_VERSION"] = 203] = "INCOMPATIBLE_VERSION";
  TSStatusCode2[TSStatusCode2["REDIRECTION_RECOMMEND"] = 400] = "REDIRECTION_RECOMMEND";
  TSStatusCode2[TSStatusCode2["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
  TSStatusCode2[TSStatusCode2["UNSUPPORTED_OPERATION"] = 501] = "UNSUPPORTED_OPERATION";
  TSStatusCode2[TSStatusCode2["ILLEGAL_PARAMETER"] = 600] = "ILLEGAL_PARAMETER";
  return TSStatusCode2;
})(TSStatusCode || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RedirectException,
  TSStatusCode
});
//# sourceMappingURL=Errors.js.map
