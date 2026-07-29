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
var RowRecord_exports = {};
__export(RowRecord_exports, {
  RowRecord: () => RowRecord
});
module.exports = __toCommonJS(RowRecord_exports);
class RowRecord {
  constructor(timestamp, fields, columnNames, columnTypes, columnNameIndexMap) {
    this.timestamp = timestamp;
    this.fields = fields;
    this.columnNames = columnNames;
    this.columnTypes = columnTypes;
    this.columnNameIndexMap = columnNameIndexMap;
  }
  /**
   * Get the timestamp of this row
   */
  getTimestamp() {
    return this.timestamp;
  }
  /**
   * Get all field values
   */
  getFields() {
    return this.fields;
  }
  /**
   * Get column names
   */
  getColumnNames() {
    return this.columnNames;
  }
  /**
   * Get value by column index
   */
  getValueByIndex(index) {
    if (index < 0 || index >= this.fields.length) {
      throw new Error(`Column index out of range: ${index}`);
    }
    return this.fields[index];
  }
  /**
   * Get value by column name
   */
  getValue(columnName) {
    const index = this.columnNameIndexMap.get(columnName);
    if (index === void 0) {
      throw new Error(`Column not found: ${columnName}`);
    }
    return this.fields[index];
  }
  /**
   * Check if value is null by index
   */
  isNullByIndex(index) {
    return this.getValueByIndex(index) === null || this.getValueByIndex(index) === void 0;
  }
  /**
   * Check if value is null by column name
   */
  isNull(columnName) {
    return this.getValue(columnName) === null || this.getValue(columnName) === void 0;
  }
  /**
   * Get string value by index
   */
  getStringByIndex(index) {
    const value = this.getValueByIndex(index);
    return value !== null && value !== void 0 ? String(value) : "";
  }
  /**
   * Get string value by column name
   */
  getString(columnName) {
    const value = this.getValue(columnName);
    return value !== null && value !== void 0 ? String(value) : "";
  }
  /**
   * Get integer value by index
   */
  getIntByIndex(index) {
    return Number(this.getValueByIndex(index));
  }
  /**
   * Get integer value by column name
   */
  getInt(columnName) {
    return Number(this.getValue(columnName));
  }
  /**
   * Get long value by index
   */
  getLongByIndex(index) {
    return Number(this.getValueByIndex(index));
  }
  /**
   * Get long value by column name
   */
  getLong(columnName) {
    return Number(this.getValue(columnName));
  }
  /**
   * Get float value by index
   */
  getFloatByIndex(index) {
    return Number(this.getValueByIndex(index));
  }
  /**
   * Get float value by column name
   */
  getFloat(columnName) {
    return Number(this.getValue(columnName));
  }
  /**
   * Get double value by index
   */
  getDoubleByIndex(index) {
    return Number(this.getValueByIndex(index));
  }
  /**
   * Get double value by column name
   */
  getDouble(columnName) {
    return Number(this.getValue(columnName));
  }
  /**
   * Get boolean value by index
   */
  getBooleanByIndex(index) {
    return Boolean(this.getValueByIndex(index));
  }
  /**
   * Get boolean value by column name
   */
  getBoolean(columnName) {
    return Boolean(this.getValue(columnName));
  }
  /**
   * Convert row to array (timestamp + fields)
   */
  toArray() {
    return [this.timestamp, ...this.fields];
  }
  /**
   * Convert row to string representation
   */
  toString() {
    return `RowRecord{timestamp=${this.timestamp}, fields=[${this.fields.join(", ")}]}`;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RowRecord
});
//# sourceMappingURL=RowRecord.js.map
