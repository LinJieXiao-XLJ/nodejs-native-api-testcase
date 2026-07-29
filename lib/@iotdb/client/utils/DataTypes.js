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
var DataTypes_exports = {};
__export(DataTypes_exports, {
  TSDataType: () => TSDataType,
  getDataTypeName: () => getDataTypeName,
  parseDateToInt: () => parseDateToInt,
  parseIntToDate: () => parseIntToDate
});
module.exports = __toCommonJS(DataTypes_exports);
var TSDataType = /* @__PURE__ */ ((TSDataType2) => {
  TSDataType2[TSDataType2["BOOLEAN"] = 0] = "BOOLEAN";
  TSDataType2[TSDataType2["INT32"] = 1] = "INT32";
  TSDataType2[TSDataType2["INT64"] = 2] = "INT64";
  TSDataType2[TSDataType2["FLOAT"] = 3] = "FLOAT";
  TSDataType2[TSDataType2["DOUBLE"] = 4] = "DOUBLE";
  TSDataType2[TSDataType2["TEXT"] = 5] = "TEXT";
  TSDataType2[TSDataType2["TIMESTAMP"] = 8] = "TIMESTAMP";
  TSDataType2[TSDataType2["DATE"] = 9] = "DATE";
  TSDataType2[TSDataType2["BLOB"] = 10] = "BLOB";
  TSDataType2[TSDataType2["STRING"] = 11] = "STRING";
  return TSDataType2;
})(TSDataType || {});
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapYear(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
function validateCalendarDate(year, month, day, source) {
  if (year < 1e3 || year > 9999) {
    throw new Error(
      `Invalid DATE value ${source}: year ${year} is out of range [1000, 9999]`
    );
  }
  if (month < 1 || month > 12) {
    throw new Error(
      `Invalid DATE value ${source}: month ${month} is out of range [1, 12]`
    );
  }
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  if (day < 1 || day > maxDay) {
    throw new Error(
      `Invalid DATE value ${source}: day ${day} is out of range [1, ${maxDay}] for ${year}-${String(month).padStart(2, "0")}`
    );
  }
}
function parseDateToInt(value) {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new Error("Invalid DATE value: Date object is invalid (NaN time)");
    }
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth() + 1;
    const day = value.getUTCDate();
    validateCalendarDate(year, month, day, value.toISOString());
    return year * 1e4 + month * 100 + day;
  }
  if (!Number.isInteger(value)) {
    throw new Error(
      `Invalid DATE value ${value}: expected an integer in yyyyMMdd form (e.g. 20240101)`
    );
  }
  validateCalendarDate(
    Math.trunc(value / 1e4),
    Math.trunc(value / 100) % 100,
    value % 100,
    String(value)
  );
  return value;
}
function parseIntToDate(value) {
  if (!Number.isInteger(value)) {
    throw new Error(
      `Invalid DATE value ${value}: expected an integer in yyyyMMdd form (e.g. 20240101)`
    );
  }
  const year = Math.trunc(value / 1e4);
  const month = Math.trunc(value / 100) % 100;
  const day = value % 100;
  validateCalendarDate(year, month, day, String(value));
  return new Date(Date.UTC(year, month - 1, day));
}
function getDataTypeName(typeCode) {
  switch (typeCode) {
    case 0 /* BOOLEAN */:
      return "BOOLEAN";
    case 1 /* INT32 */:
      return "INT32";
    case 2 /* INT64 */:
      return "INT64";
    case 3 /* FLOAT */:
      return "FLOAT";
    case 4 /* DOUBLE */:
      return "DOUBLE";
    case 5 /* TEXT */:
      return "TEXT";
    case 8 /* TIMESTAMP */:
      return "TIMESTAMP";
    case 9 /* DATE */:
      return "DATE";
    case 10 /* BLOB */:
      return "BLOB";
    case 11 /* STRING */:
      return "STRING";
    default:
      return "UNKNOWN";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TSDataType,
  getDataTypeName,
  parseDateToInt,
  parseIntToDate
});
//# sourceMappingURL=DataTypes.js.map
