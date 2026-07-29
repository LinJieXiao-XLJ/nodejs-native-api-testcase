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
var Session_exports = {};
__export(Session_exports, {
  ColumnCategory: () => ColumnCategory,
  RowRecord: () => import_RowRecord.RowRecord,
  Session: () => Session,
  SessionDataSet: () => import_SessionDataSet.SessionDataSet,
  TableTablet: () => TableTablet,
  TreeTablet: () => TreeTablet
});
module.exports = __toCommonJS(Session_exports);
var import_Connection = require("../connection/Connection");
var import_Config = require("../utils/Config");
var import_Logger = require("../utils/Logger");
var import_ProcessCleanup = require("../utils/ProcessCleanup");
var import_SessionDataSet = require("./SessionDataSet");
var import_RowRecord = require("./RowRecord");
var import_ColumnDecoder = require("./ColumnDecoder");
var import_FastSerializer = require("../utils/FastSerializer");
var import_DataTypes = require("../utils/DataTypes");
const ttypes = require("../thrift/generated/client_types");
var ColumnCategory = /* @__PURE__ */ ((ColumnCategory2) => {
  ColumnCategory2[ColumnCategory2["TAG"] = 0] = "TAG";
  ColumnCategory2[ColumnCategory2["FIELD"] = 1] = "FIELD";
  ColumnCategory2[ColumnCategory2["ATTRIBUTE"] = 2] = "ATTRIBUTE";
  ColumnCategory2[ColumnCategory2["TIME"] = 3] = "TIME";
  return ColumnCategory2;
})(ColumnCategory || {});
class TreeTablet {
  constructor(deviceId, measurements, dataTypes) {
    this.deviceId = deviceId;
    this.measurements = measurements;
    this.dataTypes = dataTypes;
    this.timestamps = [];
    this.values = [];
  }
  /**
   * Add a row to the tablet
   * @param timestamp - The timestamp for this row
   * @param values - Array of values, must match the length of measurements
   */
  addRow(timestamp, values) {
    if (values.length !== this.measurements.length) {
      throw new Error(
        `Values array length (${values.length}) does not match measurements length (${this.measurements.length})`
      );
    }
    this.timestamps.push(timestamp);
    this.values.push(values);
  }
}
class TableTablet {
  constructor(tableName, columnNames, columnTypes, columnCategories) {
    if (columnNames.length !== columnTypes.length || columnNames.length !== columnCategories.length) {
      throw new Error(
        "columnNames, columnTypes, and columnCategories must have the same length"
      );
    }
    this.tableName = tableName;
    this.columnNames = columnNames;
    this.columnTypes = columnTypes;
    this.columnCategories = columnCategories;
    this.timestamps = [];
    this.values = [];
  }
  /**
   * Add a row to the tablet
   * @param timestamp - The timestamp for this row
   * @param values - Array of values, must match the length of columnNames
   */
  addRow(timestamp, values) {
    if (values.length !== this.columnNames.length) {
      throw new Error(
        `Values array length (${values.length}) does not match columnNames length (${this.columnNames.length})`
      );
    }
    this.timestamps.push(timestamp);
    this.values.push(values);
  }
}
class Session {
  constructor(config) {
    this.lastRedirectEndpoint = null;
    if (!config.host && !config.nodeUrls) {
      throw new Error("Either host/port or nodeUrls must be provided");
    }
    if (config.host && !config.port) {
      throw new Error("Port is required when host is provided");
    }
    if (config.nodeUrls && config.nodeUrls.length === 0) {
      throw new Error("nodeUrls array cannot be empty");
    }
    if (config.nodeUrls && config.nodeUrls.length > 0) {
      const endpoints = typeof config.nodeUrls[0] === "string" ? (0, import_Config.parseNodeUrls)(config.nodeUrls) : config.nodeUrls;
      const firstNode = endpoints[0];
      this.config = {
        ...import_Config.DEFAULT_CONFIG,
        ...config,
        host: firstNode.host,
        port: firstNode.port
      };
    } else {
      this.config = { ...import_Config.DEFAULT_CONFIG, ...config };
    }
    this.connection = new import_Connection.Connection(this.config);
    (0, import_ProcessCleanup.registerClosable)(this);
  }
  async open() {
    await this.connection.open();
  }
  async close() {
    await this.connection.close();
    (0, import_ProcessCleanup.unregisterClosable)(this);
  }
  /**
   * Get and clear the last redirect endpoint recommendation.
   * Returns null if no redirect was recommended in the last operation.
   */
  getAndClearLastRedirect() {
    const redirect = this.lastRedirectEndpoint;
    this.lastRedirectEndpoint = null;
    return redirect;
  }
  /**
   * Execute a query and return a SessionDataSet for iterating through results.
   * This method supports lazy loading and proper resource management.
   *
   * @param sql SQL query statement
   * @param timeoutMs Query timeout in milliseconds (default: 60000)
   * @returns SessionDataSet for iterating through query results
   *
   * @example
   * ```typescript
   * const dataSet = await session.executeQueryStatement('SELECT * FROM root.test');
   * while (await dataSet.hasNext()) {
   *   const row = dataSet.next();
   *   console.log(row.getTimestamp(), row.getFields());
   * }
   * await dataSet.close();
   * ```
   */
  async executeQueryStatement(sql, timeoutMs = 6e4) {
    import_Logger.logger.debug(`Executing query: ${sql}`);
    const client = this.connection.getClient();
    const sessionId = this.connection.getSessionId();
    const statementId = this.connection.getStatementId();
    const req = new ttypes.TSExecuteStatementReq({
      sessionId,
      statement: sql,
      statementId,
      fetchSize: this.config.fetchSize || 1024,
      timeout: timeoutMs,
      enableRedirectQuery: true,
      jdbcQuery: false
      // Changed to false to use queryDataSet format
    });
    return new Promise((resolve, reject) => {
      client.executeQueryStatementV2(req, async (err, response) => {
        var _a, _b, _c;
        if (err) {
          reject(err);
          return;
        }
        if (response.status.code !== 200) {
          reject(new Error(response.status.message || "Query failed"));
          return;
        }
        try {
          let initialRows;
          const ignoreTimeStamp = response.ignoreTimeStamp || false;
          import_Logger.logger.debug(
            `executeQueryStatement response: ignoreTimeStamp=${ignoreTimeStamp}`
          );
          import_Logger.logger.debug(
            `executeQueryStatement response: queryResult exists=${!!response.queryResult}, length=${((_a = response.queryResult) == null ? void 0 : _a.length) || 0}`
          );
          import_Logger.logger.debug(
            `executeQueryStatement response: queryDataSet exists=${!!response.queryDataSet}`
          );
          if (response.queryResult && response.queryResult.length > 0) {
            initialRows = await this.parseQueryResult(
              response.queryResult,
              ((_b = response.columns) == null ? void 0 : _b.length) || 0,
              response.dataTypeList || [],
              ignoreTimeStamp,
              response.columnIndex2TsBlockColumnIndexList
            );
          } else if (response.queryDataSet) {
            initialRows = await this.parseDataSet(
              response.queryDataSet,
              ((_c = response.columns) == null ? void 0 : _c.length) || 0,
              response.dataTypeList || []
            );
          } else {
            initialRows = [];
          }
          const dataSet = new import_SessionDataSet.SessionDataSet(
            this,
            response.queryId,
            statementId,
            sql,
            response.columns || [],
            response.dataTypeList || [],
            initialRows,
            response.moreData || false,
            this.config.fetchSize || 1024,
            sessionId,
            ignoreTimeStamp,
            response.columnIndex2TsBlockColumnIndexList
          );
          resolve(dataSet);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }
  async executeNonQueryStatement(sql) {
    import_Logger.logger.debug(`Executing non-query: ${sql}`);
    const client = this.connection.getClient();
    const sessionId = this.connection.getSessionId();
    const statementId = this.connection.getStatementId();
    const req = new ttypes.TSExecuteStatementReq({
      sessionId,
      statement: sql,
      statementId
    });
    return new Promise((resolve, reject) => {
      client.executeUpdateStatementV2(req, (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        if (response.status.code !== 200) {
          reject(
            new Error(response.status.message || "Statement execution failed")
          );
          return;
        }
        resolve();
      });
    });
  }
  /**
   * Insert tablet (supports both tree and table models)
   * @param tablet TreeTablet for tree model or TableTablet for table model
   */
  async insertTablet(tablet) {
    if ("tableName" in tablet) {
      return this.insertTableTabletInternal(
        tablet
      );
    } else {
      return this.insertTreeTabletInternal(tablet);
    }
  }
  /**
   * Internal method to insert tree model tablet
   */
  async insertTreeTabletInternal(tablet) {
    const totalStartTime = Date.now();
    import_Logger.logger.debug(`[PERF] insertTreeTablet START for device: ${tablet.deviceId}, rows: ${tablet.timestamps.length}, cols: ${tablet.measurements.length}`);
    const client = this.connection.getClient();
    const sessionId = this.connection.getSessionId();
    const timestampStartTime = Date.now();
    const timestampBuffer = this.config.enableFastSerialization ? (0, import_FastSerializer.serializeTimestamps)(tablet.timestamps) : this.serializeTimestampsLegacy(tablet.timestamps);
    const timestampDuration = Date.now() - timestampStartTime;
    import_Logger.logger.debug(`[PERF] Timestamp serialization (fast=${this.config.enableFastSerialization}): ${timestampDuration}ms`);
    const serializeStartTime = Date.now();
    const valuesBuffer = this.serializeTabletValues(
      tablet.values,
      tablet.dataTypes,
      tablet.timestamps.length
    );
    const serializeDuration = Date.now() - serializeStartTime;
    import_Logger.logger.debug(`[PERF] Values serialization: ${serializeDuration}ms, buffer size: ${valuesBuffer.length} bytes`);
    const req = new ttypes.TSInsertTabletReq({
      sessionId,
      prefixPath: tablet.deviceId,
      measurements: tablet.measurements,
      values: valuesBuffer,
      timestamps: timestampBuffer,
      types: tablet.dataTypes,
      size: tablet.timestamps.length,
      isAligned: false
    });
    const rpcStartTime = Date.now();
    return new Promise((resolve, reject) => {
      client.insertTablet(req, (err, response) => {
        const rpcDuration = Date.now() - rpcStartTime;
        const totalDuration = Date.now() - totalStartTime;
        import_Logger.logger.debug(`[PERF] RPC call: ${rpcDuration}ms, Total: ${totalDuration}ms (serialize: ${timestampDuration + serializeDuration}ms)`);
        if (err) {
          reject(err);
          return;
        }
        if (response.code === 400) {
          if (response.redirectNode) {
            this.lastRedirectEndpoint = {
              host: response.redirectNode.internalIp || response.redirectNode.ip,
              port: response.redirectNode.port
            };
            import_Logger.logger.debug(
              `Server recommends endpoint ${this.lastRedirectEndpoint.host}:${this.lastRedirectEndpoint.port} for future writes to ${tablet.deviceId}`
            );
          } else {
            import_Logger.logger.debug(`Server returned code 400 without redirect node for ${tablet.deviceId}`);
          }
          resolve();
          return;
        }
        if (response.code !== 200) {
          reject(new Error(response.message || "Insert tablet failed"));
          return;
        }
        resolve();
      });
    });
  }
  /**
   * Internal method to insert table model tablet
   */
  async insertTableTabletInternal(tablet) {
    const totalStartTime = Date.now();
    import_Logger.logger.debug(`[PERF] insertTableTablet START for table: ${tablet.tableName}, rows: ${tablet.timestamps.length}, cols: ${tablet.columnNames.length}`);
    const client = this.connection.getClient();
    const sessionId = this.connection.getSessionId();
    const timestampStartTime = Date.now();
    const timestampBuffer = this.config.enableFastSerialization ? (0, import_FastSerializer.serializeTimestamps)(tablet.timestamps) : this.serializeTimestampsLegacy(tablet.timestamps);
    const timestampDuration = Date.now() - timestampStartTime;
    import_Logger.logger.debug(`[PERF] Timestamp serialization (fast=${this.config.enableFastSerialization}): ${timestampDuration}ms`);
    const prefixPath = tablet.tableName;
    const columnCategoriesBytes = tablet.columnCategories.map((category) => {
      return category < 128 ? category : category - 256;
    });
    const serializeStartTime = Date.now();
    const valuesBuffer = this.serializeTabletValues(
      tablet.values,
      tablet.columnTypes,
      tablet.timestamps.length
    );
    const serializeDuration = Date.now() - serializeStartTime;
    import_Logger.logger.debug(`[PERF] Values serialization: ${serializeDuration}ms, buffer size: ${valuesBuffer.length} bytes`);
    const req = new ttypes.TSInsertTabletReq({
      sessionId,
      prefixPath,
      measurements: tablet.columnNames,
      values: valuesBuffer,
      timestamps: timestampBuffer,
      types: tablet.columnTypes,
      size: tablet.timestamps.length,
      isAligned: false,
      writeToTable: true,
      // CRITICAL: Tell IoTDB this is table model data
      columnCategories: columnCategoriesBytes
      // Pass column categories for table model
    });
    const rpcStartTime = Date.now();
    return new Promise((resolve, reject) => {
      client.insertTablet(req, (err, response) => {
        const rpcDuration = Date.now() - rpcStartTime;
        const totalDuration = Date.now() - totalStartTime;
        import_Logger.logger.debug(`[PERF] RPC call: ${rpcDuration}ms, Total: ${totalDuration}ms (serialize: ${timestampDuration + serializeDuration}ms)`);
        if (err) {
          reject(err);
          return;
        }
        if (response.code === 400) {
          if (response.redirectNode) {
            this.lastRedirectEndpoint = {
              host: response.redirectNode.internalIp || response.redirectNode.ip,
              port: response.redirectNode.port
            };
            import_Logger.logger.debug(
              `Server recommends endpoint ${this.lastRedirectEndpoint.host}:${this.lastRedirectEndpoint.port} for future writes to table ${tablet.tableName}`
            );
          } else {
            import_Logger.logger.debug(`Server returned code 400 without redirect node for table ${tablet.tableName}`);
          }
          resolve();
          return;
        }
        if (response.code !== 200) {
          const errorMsg = response.message || "Insert table tablet failed";
          import_Logger.logger.error(`Insert table tablet failed: code=${response.code}, message=${response.message}`);
          import_Logger.logger.error(`Request details: prefixPath=${prefixPath}, columns=${tablet.columnNames.length}, rows=${tablet.timestamps.length}`);
          reject(new Error(`${errorMsg} (code: ${response.code})`));
          return;
        }
        resolve();
      });
    });
  }
  /**
   * Legacy timestamp serialization (for when enableFastSerialization=false)
   */
  serializeTimestampsLegacy(timestamps) {
    const bigIntTimestamps = timestamps.map((t) => {
      if (typeof t !== "number" || !Number.isFinite(t)) {
        throw new Error(`Invalid timestamp: ${t}`);
      }
      return BigInt(Math.floor(t));
    });
    const timestampBuffer = Buffer.alloc(bigIntTimestamps.length * 8);
    bigIntTimestamps.forEach((ts, i) => {
      timestampBuffer.writeBigInt64BE(ts, i * 8);
    });
    return timestampBuffer;
  }
  serializeTabletValues(values, dataTypes, rowCount) {
    if (this.config.enableFastSerialization) {
      return (0, import_FastSerializer.serializeTabletValuesFast)(values, dataTypes, rowCount);
    }
    const buffers = [];
    const bitMaps = [];
    for (let colIndex = 0; colIndex < dataTypes.length; colIndex++) {
      const dataType = dataTypes[colIndex];
      const columnValues = values.map((row) => row[colIndex]);
      const nullBitmap = [];
      let hasNull = false;
      for (let rowIndex = 0; rowIndex < columnValues.length; rowIndex++) {
        const isNull = columnValues[rowIndex] === null || columnValues[rowIndex] === void 0;
        nullBitmap.push(isNull);
        if (isNull) {
          hasNull = true;
        }
      }
      const buffer = this.serializeColumn(columnValues, dataType);
      buffers.push(buffer);
      bitMaps.push(hasNull ? nullBitmap : null);
    }
    const bitmapBuffer = this.serializeBitMaps(bitMaps, rowCount);
    buffers.push(bitmapBuffer);
    return Buffer.concat(buffers);
  }
  serializeColumn(values, dataType) {
    switch (dataType) {
      case 0:
        return Buffer.from(
          values.map((v) => v === null || v === void 0 ? 0 : v ? 1 : 0)
        );
      case 1: {
        const buffer = Buffer.alloc(values.length * 4);
        values.forEach((v, i) => {
          buffer.writeInt32BE(v === null || v === void 0 ? 0 : v, i * 4);
        });
        return buffer;
      }
      case 2: {
        const buffer = Buffer.alloc(values.length * 8);
        values.forEach((v, i) => {
          buffer.writeBigInt64BE(
            v === null || v === void 0 ? BigInt(0) : BigInt(v),
            i * 8
          );
        });
        return buffer;
      }
      case 3: {
        const buffer = Buffer.alloc(values.length * 4);
        values.forEach((v, i) => {
          buffer.writeFloatBE(v === null || v === void 0 ? 0 : v, i * 4);
        });
        return buffer;
      }
      case 4: {
        const buffer = Buffer.alloc(values.length * 8);
        values.forEach((v, i) => {
          buffer.writeDoubleBE(v === null || v === void 0 ? 0 : v, i * 8);
        });
        return buffer;
      }
      case 5:
      // TEXT
      case 11: {
        const strData = [];
        let totalSize = 0;
        for (const v of values) {
          const str = v === null || v === void 0 ? "" : String(v);
          const strBytes = Buffer.from(str, "utf8");
          strData.push(strBytes);
          totalSize += 4 + strBytes.length;
        }
        const result = Buffer.allocUnsafe(totalSize);
        let offset = 0;
        for (const strBytes of strData) {
          result.writeInt32BE(strBytes.length, offset);
          offset += 4;
          strBytes.copy(result, offset);
          offset += strBytes.length;
        }
        return result;
      }
      case 8: {
        const buffer = Buffer.alloc(values.length * 8);
        values.forEach((v, i) => {
          let timestamp = BigInt(0);
          if (v !== null && v !== void 0) {
            if (v instanceof Date) {
              timestamp = BigInt(v.getTime());
            } else {
              timestamp = BigInt(v);
            }
          }
          buffer.writeBigInt64BE(timestamp, i * 8);
        });
        return buffer;
      }
      case 9: {
        const buffer = Buffer.alloc(values.length * 4);
        values.forEach((v, i) => {
          const encoded = v === null || v === void 0 ? 0 : (0, import_DataTypes.parseDateToInt)(v);
          buffer.writeInt32BE(encoded, i * 4);
        });
        return buffer;
      }
      case 10: {
        const blobData = [];
        let totalSize = 0;
        for (const v of values) {
          const blob = v === null || v === void 0 ? Buffer.alloc(0) : Buffer.isBuffer(v) ? v : Buffer.from(v);
          blobData.push(blob);
          totalSize += 4 + blob.length;
        }
        const result = Buffer.allocUnsafe(totalSize);
        let offset = 0;
        for (const blob of blobData) {
          result.writeInt32BE(blob.length, offset);
          offset += 4;
          blob.copy(result, offset);
          offset += blob.length;
        }
        return result;
      }
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }
  /**
   * Serialize BitMap for null value indicators.
   *
   * BitMap Serialization Format (compatible with Apache IoTDB Java client):
   *
   * For each column:
   *   1. columnHasNull flag (1 byte): 0=no nulls, 1=has nulls
   *   2. If has nulls: bitmap array
   *      - 8 values packed per byte (LSB-first bit ordering)
   *      - Bit=1 means NULL, Bit=0 means NOT NULL
   *      - Size = Math.ceil(rowCount / 8) bytes
   *      - Padding: Remaining bits in last byte are set to 0
   *
   * Example 1: rowCount=10, nulls at indices [1, 4, 6, 9]
   *   Row indices:     0  1  2  3  4  5  6  7  | 8  9  (6 padding bits)
   *   Null values:     0  1  0  0  1  0  1  0  | 0  1  0  0  0  0  0  0
   *   Bit positions:   0  1  2  3  4  5  6  7  | 0  1  2  3  4  5  6  7
   *   Binary (LSB):    01001010                 |    01000000
   *   Hex:             0x52                     |    0x02
   *
   * Example 2: rowCount=13, nulls at indices [0, 3, 8, 10]
   *   Byte 1: indices 0-7  → binary 00001001 → 0x09
   *   Byte 2: indices 8-12 → binary 00000101 → 0x05
   *
   * Bit Ordering Details (LSB-first):
   *   - Row index 0 maps to bit 0 (LSB) = 1 << 0 = 0x01
   *   - Row index 1 maps to bit 1       = 1 << 1 = 0x02
   *   - Row index 2 maps to bit 2       = 1 << 2 = 0x04
   *   - Row index 3 maps to bit 3       = 1 << 3 = 0x08
   *   - ...
   *   - Row index 7 maps to bit 7 (MSB) = 1 << 7 = 0x80
   *
   * This format is compatible with:
   * - Java: org.apache.iotdb.session.tablet.Tablet.writeBitMaps()
   * - C++: Session::getValue() with BitMap serialization
   * - Python: Tablet.get_binary_values() with struct.pack
   *
   * @param bitMaps - Array of boolean arrays (or null) for each column, true=null, false=not null
   * @param rowCount - Number of rows in the tablet
   * @returns Serialized bitmap buffer
   */
  serializeBitMaps(bitMaps, rowCount) {
    const buffers = [];
    for (const bitMap of bitMaps) {
      const columnHasNull = bitMap !== null;
      buffers.push(Buffer.from([columnHasNull ? 1 : 0]));
      if (columnHasNull && bitMap) {
        const bitmapByteCount = Math.ceil(rowCount / 8);
        const bitmapBytes = Buffer.alloc(bitmapByteCount);
        for (let i = 0; i < bitMap.length; i++) {
          if (bitMap[i]) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;
            bitmapBytes[byteIndex] |= 1 << bitIndex;
          }
        }
        buffers.push(bitmapBytes);
      }
    }
    return Buffer.concat(buffers);
  }
  /**
   * Parse queryResult (TsBlock format) - new format used by IoTDB
   * Each buffer in queryResult is a complete TsBlock containing:
   * - Value column count (INT32)
   * - Value column data types (list of BYTE)
   * - Position count (INT32)
   * - Column encodings (list of BYTE)
   * - Time column data
   * - Value columns data
   *
   * @param ignoreTimeStamp - If true, no time column is present
   * @param columnIndex2TsBlockColumnIndexList - Server-provided mapping from
   *   LOGICAL response column index to PHYSICAL TsBlock column index (-1 =
   *   time column); identity mapping is assumed when absent
   */
  async parseQueryResult(queryResult, _columnCount, dataTypes, ignoreTimeStamp = false, columnIndex2TsBlockColumnIndexList) {
    const rows = [];
    if (!queryResult || queryResult.length === 0) {
      import_Logger.logger.debug("parseQueryResult: queryResult is null or empty");
      return rows;
    }
    import_Logger.logger.debug(
      `parseQueryResult: queryResult has ${queryResult.length} TsBlocks, ignoreTimeStamp=${ignoreTimeStamp}`
    );
    import_Logger.logger.debug(`parseQueryResult: dataTypes: ${JSON.stringify(dataTypes)}`);
    const physicalColumnTypes = this.derivePhysicalColumnTypes(
      dataTypes,
      columnIndex2TsBlockColumnIndexList
    );
    for (let blockIndex = 0; blockIndex < queryResult.length; blockIndex++) {
      const tsBlockBuffer = Buffer.isBuffer(queryResult[blockIndex]) ? queryResult[blockIndex] : Buffer.from(queryResult[blockIndex]);
      import_Logger.logger.debug(
        `parseQueryResult: Processing TsBlock ${blockIndex}, size=${tsBlockBuffer.length} bytes`
      );
      try {
        const blockRows = this.parseTsBlock(
          tsBlockBuffer,
          physicalColumnTypes,
          ignoreTimeStamp
        );
        rows.push(...blockRows);
      } catch (error) {
        import_Logger.logger.error(`Error parsing TsBlock ${blockIndex}:`, error);
        throw error;
      }
    }
    import_Logger.logger.debug(`parseQueryResult: returning ${rows.length} total rows`);
    return rows;
  }
  /**
   * Derive the per-PHYSICAL-TsBlock-column logical data types from the
   * logically-ordered dataTypeList and the server-provided
   * columnIndex2TsBlockColumnIndexList (logical index -> physical index,
   * -1 = time column).
   *
   * Multiple logical columns may map to the same physical column (the server
   * deduplicates identical output columns). In practice duplicates share one
   * type; if they ever disagree, the physical column's type is left undefined
   * so no type-specific conversion is applied.
   *
   * When the mapping is absent, the logical order is the physical order
   * (identity), preserving the previous behavior.
   */
  derivePhysicalColumnTypes(dataTypes, columnIndex2TsBlockColumnIndexList) {
    if (!columnIndex2TsBlockColumnIndexList || columnIndex2TsBlockColumnIndexList.length === 0) {
      return dataTypes;
    }
    const physicalTypes = [];
    const conflicting = /* @__PURE__ */ new Set();
    for (let i = 0; i < dataTypes.length; i++) {
      const physicalIndex = columnIndex2TsBlockColumnIndexList[i];
      if (physicalIndex === void 0 || physicalIndex < 0) {
        continue;
      }
      const existing = physicalTypes[physicalIndex];
      if (existing === void 0) {
        physicalTypes[physicalIndex] = dataTypes[i];
      } else if (existing !== dataTypes[i]) {
        conflicting.add(physicalIndex);
      }
    }
    for (const physicalIndex of conflicting) {
      import_Logger.logger.warn(
        `derivePhysicalColumnTypes: conflicting logical types for TsBlock column ${physicalIndex}; skipping type conversion for it`
      );
      physicalTypes[physicalIndex] = void 0;
    }
    return physicalTypes;
  }
  /**
   * Parse a single TsBlock buffer
   * TsBlock format (from Apache IoTDB C# client):
   * +-------------+---------------+---------+------------+-----------+----------+
   * | val col cnt | val col types | pos cnt | encodings  | time col  | val col  |
   * +-------------+---------------+---------+------------+-----------+----------+
   * | int32       | list[byte]    | int32   | list[byte] |  bytes    | bytes    |
   * +-------------+---------------+---------+------------+-----------+----------+
   *
   * IMPORTANT: TsBlock ALWAYS contains time column encoding and time column data,
   * regardless of the ignoreTimeStamp setting. The ignoreTimeStamp flag only
   * affects whether the timestamp is included in the returned row data, not the
   * TsBlock binary format. This matches the behavior of iotdb-client-csharp.
   *
   * @param physicalColumnTypes - Logical data types ordered by PHYSICAL
   *   TsBlock column (see derivePhysicalColumnTypes); an undefined entry means
   *   "unknown, apply no type-specific conversion"
   */
  parseTsBlock(buffer, physicalColumnTypes, ignoreTimeStamp) {
    let offset = 0;
    const valueColumnCount = buffer.readInt32BE(offset);
    offset += 4;
    import_Logger.logger.debug(`TsBlock: valueColumnCount=${valueColumnCount}`);
    const valueColumnTypes = [];
    for (let i = 0; i < valueColumnCount; i++) {
      valueColumnTypes.push(buffer.readUInt8(offset));
      offset += 1;
    }
    import_Logger.logger.debug(
      `TsBlock: valueColumnTypes=${JSON.stringify(valueColumnTypes)}`
    );
    const positionCount = buffer.readInt32BE(offset);
    offset += 4;
    import_Logger.logger.debug(`TsBlock: positionCount=${positionCount}`);
    const timeEncoding = buffer.readUInt8(offset);
    offset += 1;
    import_Logger.logger.debug(`TsBlock: timeEncoding=${timeEncoding}`);
    const valueEncodings = [];
    for (let i = 0; i < valueColumnCount; i++) {
      valueEncodings.push(buffer.readUInt8(offset));
      offset += 1;
    }
    import_Logger.logger.debug(`TsBlock: valueEncodings=${JSON.stringify(valueEncodings)}`);
    const timeDecoder = import_ColumnDecoder.BaseColumnDecoder.getDecoder(timeEncoding);
    const { column: timeColumn, bytesRead: timeColumnBytesRead } = timeDecoder.readColumn(buffer, offset, 8, positionCount);
    offset += timeColumnBytesRead;
    import_Logger.logger.debug(
      `TsBlock: read time column, ${timeColumn.values.length} timestamps, ignoreTimeStamp=${ignoreTimeStamp}`
    );
    const valueColumns = [];
    for (let i = 0; i < valueColumnCount; i++) {
      const dataType = valueColumnTypes[i];
      const encoding = valueEncodings[i];
      const decoder = import_ColumnDecoder.BaseColumnDecoder.getDecoder(encoding);
      const { column, bytesRead } = decoder.readColumn(
        buffer,
        offset,
        dataType,
        positionCount
      );
      valueColumns.push(column);
      offset += bytesRead;
      import_Logger.logger.debug(
        `TsBlock: read column ${i}, type=${dataType}, encoding=${encoding}, ${column.values.length} values`
      );
    }
    for (let i = 0; i < valueColumns.length; i++) {
      if (valueColumnTypes[i] === 1 && physicalColumnTypes[i] !== void 0 && this.getDataTypeCode(physicalColumnTypes[i]) === 9) {
        const colValues = valueColumns[i].values;
        for (let j = 0; j < colValues.length; j++) {
          if (colValues[j] !== null) {
            colValues[j] = (0, import_DataTypes.parseIntToDate)(colValues[j]);
          }
        }
      }
    }
    const rows = [];
    for (let rowIndex = 0; rowIndex < positionCount; rowIndex++) {
      const row = [];
      if (!ignoreTimeStamp && timeColumn && rowIndex < timeColumn.values.length) {
        row.push(timeColumn.values[rowIndex]);
      }
      for (let colIndex = 0; colIndex < valueColumns.length; colIndex++) {
        row.push(valueColumns[colIndex].values[rowIndex]);
      }
      rows.push(row);
    }
    return rows;
  }
  /**
   * Helper method to convert data type string to numeric code
   */
  getDataTypeCode(typeStr) {
    if (!typeStr) return 5;
    const type = String(typeStr).toUpperCase();
    if (type.includes("BOOLEAN")) return 0;
    else if (type.includes("INT32")) return 1;
    else if (type.includes("INT64")) return 2;
    else if (type.includes("FLOAT")) return 3;
    else if (type.includes("DOUBLE")) return 4;
    else if (type.includes("TEXT")) return 5;
    else if (type.includes("TIMESTAMP")) return 8;
    else if (type.includes("DATE")) return 9;
    else if (type.includes("BLOB")) return 10;
    else if (type.includes("STRING")) return 11;
    return 5;
  }
  /**
   * Helper method to determine row count from a buffer based on data type
   */
  getRowCountFromBuffer(buffer, dataType) {
    const length = buffer.length;
    switch (dataType) {
      case 0:
        return length;
      case 1:
      // INT32 - 4 bytes per value
      case 9:
        return Math.floor(length / 4);
      case 2:
      // INT64 - 8 bytes per value
      case 8:
        return Math.floor(length / 8);
      case 3:
        return Math.floor(length / 4);
      case 4:
        return Math.floor(length / 8);
      case 5:
      // TEXT - variable length, need to parse
      case 10:
      // BLOB - variable length
      case 11:
        let count = 0;
        let offset = 0;
        while (offset + 4 <= length) {
          const strLength = buffer.readInt32BE(offset);
          offset += 4 + strLength;
          count++;
        }
        return count;
      default:
        import_Logger.logger.warn(
          `Unknown data type ${dataType}, cannot determine row count`
        );
        return 0;
    }
  }
  // parseDataSet is used by SessionDataSet for parsing query results
  // Keep it as public for SessionDataSet to access
  async parseDataSet(dataset, _columnCount, dataTypes) {
    var _a;
    const rows = [];
    if (!dataset) {
      import_Logger.logger.debug("parseDataSet: dataset is null or undefined");
      return rows;
    }
    if (!dataset.time) {
      import_Logger.logger.debug("parseDataSet: dataset.time is null or undefined");
      return rows;
    }
    import_Logger.logger.debug(
      `parseDataSet: dataset.time type: ${typeof dataset.time}, isBuffer: ${Buffer.isBuffer(dataset.time)}, length: ${dataset.time.length || "N/A"}`
    );
    import_Logger.logger.debug(
      `parseDataSet: dataset.valueList type: ${typeof dataset.valueList}, isArray: ${Array.isArray(dataset.valueList)}, length: ${((_a = dataset.valueList) == null ? void 0 : _a.length) || "N/A"}`
    );
    import_Logger.logger.debug(`parseDataSet: dataTypes: ${JSON.stringify(dataTypes)}`);
    const timeBuffer = Buffer.isBuffer(dataset.time) ? dataset.time : Buffer.from(dataset.time);
    const timeBufferLength = timeBuffer.length;
    if (timeBufferLength === 0 || timeBufferLength % 8 !== 0) {
      import_Logger.logger.warn("Invalid time buffer length:", timeBufferLength);
      return rows;
    }
    const rowCount = Math.floor(timeBufferLength / 8);
    import_Logger.logger.debug(`parseDataSet: rowCount = ${rowCount}`);
    const parsedColumns = [];
    if (dataset.valueList && Array.isArray(dataset.valueList)) {
      for (let colIndex = 0; colIndex < dataset.valueList.length; colIndex++) {
        const valueBuffer = Buffer.isBuffer(dataset.valueList[colIndex]) ? dataset.valueList[colIndex] : Buffer.from(dataset.valueList[colIndex]);
        const bitmap = dataset.bitmapList && dataset.bitmapList[colIndex] ? Buffer.isBuffer(dataset.bitmapList[colIndex]) ? dataset.bitmapList[colIndex] : Buffer.from(dataset.bitmapList[colIndex]) : null;
        let dataType = 5;
        if (dataTypes && dataTypes[colIndex] !== void 0) {
          const typeStr = String(dataTypes[colIndex]).toUpperCase();
          if (typeStr.includes("BOOLEAN")) dataType = 0;
          else if (typeStr.includes("INT32")) dataType = 1;
          else if (typeStr.includes("INT64")) dataType = 2;
          else if (typeStr.includes("FLOAT")) dataType = 3;
          else if (typeStr.includes("DOUBLE")) dataType = 4;
          else if (typeStr.includes("TEXT")) dataType = 5;
          else if (typeStr.includes("TIMESTAMP")) dataType = 8;
          else if (typeStr.includes("DATE")) dataType = 9;
          else if (typeStr.includes("BLOB")) dataType = 10;
          else if (typeStr.includes("STRING")) dataType = 11;
        }
        import_Logger.logger.debug(
          `parseDataSet: column ${colIndex}, dataType = ${dataType}, valueBuffer.length = ${valueBuffer.length}`
        );
        const columnValues = this.deserializeColumn(
          valueBuffer,
          dataType,
          rowCount,
          bitmap
        );
        parsedColumns.push(columnValues);
      }
    }
    for (let i = 0; i < rowCount; i++) {
      const row = [];
      if (i * 8 + 8 <= timeBufferLength) {
        row.push(timeBuffer.readBigInt64LE(i * 8));
      }
      for (let colIndex = 0; colIndex < parsedColumns.length; colIndex++) {
        row.push(parsedColumns[colIndex][i]);
      }
      rows.push(row);
    }
    import_Logger.logger.debug(`parseDataSet: returning ${rows.length} rows`);
    return rows;
  }
  deserializeColumn(buffer, dataType, rowCount, bitmap) {
    const values = [];
    try {
      switch (dataType) {
        case 0: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              values.push(buffer[i] !== 0);
            }
          }
          break;
        }
        case 1: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              values.push(buffer.readInt32BE(i * 4));
            }
          }
          break;
        }
        case 2: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              values.push(buffer.readBigInt64BE(i * 8));
            }
          }
          break;
        }
        case 3: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              values.push(buffer.readFloatBE(i * 4));
            }
          }
          break;
        }
        case 4: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              values.push(buffer.readDoubleBE(i * 8));
            }
          }
          break;
        }
        case 5:
        // TEXT
        case 11: {
          let offset = 0;
          for (let i = 0; i < rowCount && offset < buffer.length; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              if (offset + 4 > buffer.length) break;
              const strLength = buffer.readInt32BE(offset);
              offset += 4;
              if (offset + strLength > buffer.length) break;
              const str = buffer.toString("utf8", offset, offset + strLength);
              values.push(str);
              offset += strLength;
            }
          }
          break;
        }
        case 8: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              const timestamp = Number(buffer.readBigInt64BE(i * 8));
              const date = new Date(timestamp);
              values.push(date);
            }
          }
          break;
        }
        case 9: {
          for (let i = 0; i < rowCount; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              const encoded = buffer.readInt32BE(i * 4);
              values.push((0, import_DataTypes.parseIntToDate)(encoded));
            }
          }
          break;
        }
        case 10: {
          let offset = 0;
          for (let i = 0; i < rowCount && offset < buffer.length; i++) {
            if (this.isNull(bitmap, i)) {
              values.push(null);
            } else {
              if (offset + 4 > buffer.length) break;
              const blobLength = buffer.readInt32BE(offset);
              offset += 4;
              if (offset + blobLength > buffer.length) break;
              const blob = buffer.slice(offset, offset + blobLength);
              values.push(blob);
              offset += blobLength;
            }
          }
          break;
        }
        default:
          for (let i = 0; i < rowCount; i++) {
            values.push(null);
          }
      }
    } catch (error) {
      import_Logger.logger.error("Error deserializing column:", error);
      for (let i = values.length; i < rowCount; i++) {
        values.push(null);
      }
    }
    return values;
  }
  isNull(bitmap, index) {
    if (!bitmap) return false;
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    if (byteIndex >= bitmap.length) return false;
    return (bitmap[byteIndex] & 1 << bitIndex) === 0;
  }
  isOpen() {
    return this.connection.isOpen();
  }
  /**
   * Insert multiple tablets in a single RPC call (batch insert).
   * This is more efficient than calling insertTablet multiple times,
   * especially for high-throughput scenarios.
   * 
   * Note: All tablets must be tree model tablets (have deviceId).
   * For table model tablets, use insertTabletsTable().
   * 
   * @param tablets Array of TreeTablets to insert
   * @example
   * ```typescript
   * const tablets = [
   *   { deviceId: 'root.sg.d1', measurements: ['temp'], dataTypes: [3], timestamps: [Date.now()], values: [[25.5]] },
   *   { deviceId: 'root.sg.d2', measurements: ['temp'], dataTypes: [3], timestamps: [Date.now()], values: [[26.0]] },
   * ];
   * await session.insertTablets(tablets);
   * ```
   */
  async insertTablets(tablets) {
    if (tablets.length === 0) {
      return;
    }
    const totalStartTime = Date.now();
    import_Logger.logger.debug(`[PERF] insertTablets START for ${tablets.length} tablets`);
    const client = this.connection.getClient();
    const sessionId = this.connection.getSessionId();
    const prefixPaths = [];
    const measurementsList = [];
    const valuesList = [];
    const timestampsList = [];
    const typesList = [];
    const sizeList = [];
    const serializeStartTime = Date.now();
    for (const tablet of tablets) {
      prefixPaths.push(tablet.deviceId);
      measurementsList.push(tablet.measurements);
      typesList.push(tablet.dataTypes);
      sizeList.push(tablet.timestamps.length);
      const timestampBuffer = this.config.enableFastSerialization ? (0, import_FastSerializer.serializeTimestamps)(tablet.timestamps) : this.serializeTimestampsLegacy(tablet.timestamps);
      timestampsList.push(timestampBuffer);
      const valuesBuffer = this.serializeTabletValues(
        tablet.values,
        tablet.dataTypes,
        tablet.timestamps.length
      );
      valuesList.push(valuesBuffer);
    }
    const serializeDuration = Date.now() - serializeStartTime;
    import_Logger.logger.debug(`[PERF] Tablets serialization: ${serializeDuration}ms`);
    const req = new ttypes.TSInsertTabletsReq({
      sessionId,
      prefixPaths,
      measurementsList,
      valuesList,
      timestampsList,
      typesList,
      sizeList,
      isAligned: false
    });
    const rpcStartTime = Date.now();
    return new Promise((resolve, reject) => {
      client.insertTablets(req, (err, response) => {
        const rpcDuration = Date.now() - rpcStartTime;
        const totalDuration = Date.now() - totalStartTime;
        import_Logger.logger.debug(`[PERF] insertTablets RPC: ${rpcDuration}ms, Total: ${totalDuration}ms`);
        if (err) {
          reject(err);
          return;
        }
        if (response.code === 400) {
          if (response.redirectNode) {
            this.lastRedirectEndpoint = {
              host: response.redirectNode.internalIp || response.redirectNode.ip,
              port: response.redirectNode.port
            };
            import_Logger.logger.debug(
              `Server recommends endpoint ${this.lastRedirectEndpoint.host}:${this.lastRedirectEndpoint.port} for future writes`
            );
          } else {
            import_Logger.logger.debug(`Server returned code 400 without redirect node`);
          }
          resolve();
          return;
        }
        if (response.code !== 200) {
          reject(new Error(response.message || "Insert tablets failed"));
          return;
        }
        resolve();
      });
    });
  }
  /**
   * Insert multiple tablets concurrently using Promise.all.
   * This is optimized for Node.js async patterns and maximizes throughput
   * by leveraging the event loop for parallel execution.
   * 
   * @param tablets Array of tablets to insert
   * @param concurrency Maximum number of concurrent insertions (default: 10)
   * @returns Promise that resolves when all inserts complete
   * 
   * @example
   * ```typescript
   * const tablets = generateTablets(100);
   * // Insert 100 tablets with max 20 concurrent operations
   * await session.insertTabletsParallel(tablets, 20);
   * ```
   */
  async insertTabletsParallel(tablets, concurrency = 10) {
    if (tablets.length === 0) {
      return;
    }
    const totalStartTime = Date.now();
    import_Logger.logger.debug(`[PERF] insertTabletsParallel START: ${tablets.length} tablets, concurrency: ${concurrency}`);
    const actualConcurrency = Math.min(concurrency, tablets.length);
    let tabletIndex = 0;
    const errors = [];
    const workers = Array.from({ length: actualConcurrency }, async () => {
      while (tabletIndex < tablets.length) {
        const idx = tabletIndex++;
        if (idx >= tablets.length) break;
        try {
          await this.insertTablet(tablets[idx]);
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
        }
      }
    });
    await Promise.all(workers);
    const totalDuration = Date.now() - totalStartTime;
    import_Logger.logger.debug(`[PERF] insertTabletsParallel COMPLETE: ${totalDuration}ms, ${tablets.length / (totalDuration / 1e3)} tablets/sec`);
    if (errors.length > 0) {
      throw new Error(`${errors.length} of ${tablets.length} tablet inserts failed. First error: ${errors[0].message}`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ColumnCategory,
  RowRecord,
  Session,
  SessionDataSet,
  TableTablet,
  TreeTablet
});
//# sourceMappingURL=Session.js.map
