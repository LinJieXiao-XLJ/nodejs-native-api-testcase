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
var FastSerializer_exports = {};
__export(FastSerializer_exports, {
  serializeBlobColumn: () => serializeBlobColumn,
  serializeBooleanColumn: () => serializeBooleanColumn,
  serializeColumnFast: () => serializeColumnFast,
  serializeDateColumn: () => serializeDateColumn,
  serializeDoubleColumn: () => serializeDoubleColumn,
  serializeFloatColumn: () => serializeFloatColumn,
  serializeInt32Column: () => serializeInt32Column,
  serializeInt64Column: () => serializeInt64Column,
  serializeTabletValuesFast: () => serializeTabletValuesFast,
  serializeTextColumn: () => serializeTextColumn,
  serializeTimestampColumn: () => serializeTimestampColumn,
  serializeTimestamps: () => serializeTimestamps,
  writeInt64BE: () => writeInt64BE
});
module.exports = __toCommonJS(FastSerializer_exports);
var import_DataTypes = require("./DataTypes");
function writeInt64BE(buffer, v, offset) {
  if (typeof v === "number" && Number.isSafeInteger(v)) {
    buffer.writeInt32BE(Math.floor(v / 4294967296), offset);
    buffer.writeUInt32BE(v >>> 0, offset + 4);
  } else {
    buffer.writeBigInt64BE(typeof v === "bigint" ? v : BigInt(v), offset);
  }
}
function blobByteLength(v) {
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) {
    return v.length;
  }
  if (typeof v === "string") {
    return Buffer.byteLength(v, "utf8");
  }
  if (isArrayBufferLike(v)) {
    return v.byteLength;
  }
  return v.length;
}
function isArrayBufferLike(v) {
  return v instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && v instanceof SharedArrayBuffer;
}
function serializeBooleanColumn(values) {
  const buffer = Buffer.allocUnsafe(values.length);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    buffer[i] = v === null || v === void 0 ? 0 : v ? 1 : 0;
  }
  return buffer;
}
function serializeInt32Column(values) {
  const buffer = Buffer.allocUnsafe(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    buffer.writeInt32BE(v === null || v === void 0 ? 0 : v, i * 4);
  }
  return buffer;
}
function serializeInt64Column(values) {
  const buffer = Buffer.allocUnsafe(values.length * 8);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === void 0) {
      buffer.writeInt32BE(0, i * 8);
      buffer.writeUInt32BE(0, i * 8 + 4);
    } else {
      writeInt64BE(buffer, v, i * 8);
    }
  }
  return buffer;
}
function serializeFloatColumn(values) {
  const buffer = Buffer.allocUnsafe(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    buffer.writeFloatBE(v === null || v === void 0 ? 0 : v, i * 4);
  }
  return buffer;
}
function serializeDoubleColumn(values) {
  const buffer = Buffer.allocUnsafe(values.length * 8);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    buffer.writeDoubleBE(v === null || v === void 0 ? 0 : v, i * 8);
  }
  return buffer;
}
function serializeTextColumn(values) {
  let totalSize = 0;
  let lastSizeStr = null;
  let lastSizeLen = 0;
  for (const v of values) {
    if (v === null || v === void 0) {
      totalSize += 4;
      continue;
    }
    const str = typeof v === "string" ? v : String(v);
    if (str !== lastSizeStr) {
      lastSizeLen = Buffer.byteLength(str, "utf8");
      lastSizeStr = str;
    }
    totalSize += 4 + lastSizeLen;
  }
  const result = Buffer.allocUnsafe(totalSize);
  let offset = 0;
  let lastStr = null;
  let lastBuf = null;
  for (const v of values) {
    if (v === null || v === void 0) {
      result.writeInt32BE(0, offset);
      offset += 4;
      continue;
    }
    const str = typeof v === "string" ? v : String(v);
    if (str !== lastStr || lastBuf === null) {
      lastBuf = Buffer.from(str, "utf8");
      lastStr = str;
    }
    result.writeInt32BE(lastBuf.length, offset);
    offset += 4;
    lastBuf.copy(result, offset);
    offset += lastBuf.length;
  }
  return result;
}
function serializeTimestampColumn(values) {
  const buffer = Buffer.allocUnsafe(values.length * 8);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === void 0) {
      buffer.writeInt32BE(0, i * 8);
      buffer.writeUInt32BE(0, i * 8 + 4);
    } else {
      writeInt64BE(buffer, v instanceof Date ? v.getTime() : v, i * 8);
    }
  }
  return buffer;
}
function serializeDateColumn(values) {
  const buffer = Buffer.allocUnsafe(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const encoded = v === null || v === void 0 ? 0 : (0, import_DataTypes.parseDateToInt)(v);
    buffer.writeInt32BE(encoded, i * 4);
  }
  return buffer;
}
function serializeBlobColumn(values) {
  const blobBuffers = [];
  let totalSize = 0;
  for (const v of values) {
    const blob = v === null || v === void 0 ? Buffer.alloc(0) : Buffer.isBuffer(v) ? v : Buffer.from(v);
    blobBuffers.push(blob);
    totalSize += 4 + blob.length;
  }
  const result = Buffer.allocUnsafe(totalSize);
  let offset = 0;
  for (const blob of blobBuffers) {
    result.writeInt32BE(blob.length, offset);
    offset += 4;
    blob.copy(result, offset);
    offset += blob.length;
  }
  return result;
}
function serializeTimestamps(timestamps) {
  const buffer = Buffer.allocUnsafe(timestamps.length * 8);
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    if (typeof t !== "number" || !Number.isFinite(t)) {
      throw new Error(`Invalid timestamp at index ${i}: ${t}`);
    }
    const v = Math.floor(t);
    buffer.writeInt32BE(Math.floor(v / 4294967296), i * 8);
    buffer.writeUInt32BE(v >>> 0, i * 8 + 4);
  }
  return buffer;
}
function serializeColumnFast(values, dataType) {
  switch (dataType) {
    case 0:
      return serializeBooleanColumn(values);
    case 1:
      return serializeInt32Column(values);
    case 2:
      return serializeInt64Column(values);
    case 3:
      return serializeFloatColumn(values);
    case 4:
      return serializeDoubleColumn(values);
    case 5:
    // TEXT
    case 11:
      return serializeTextColumn(values);
    case 8:
      return serializeTimestampColumn(values);
    case 9:
      return serializeDateColumn(values);
    case 10:
      return serializeBlobColumn(values);
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}
function serializeTabletValuesFast(values, dataTypes, rowCount) {
  const numCols = dataTypes.length;
  const bitmapBytes = Math.ceil(rowCount / 8);
  let dataSize = 0;
  for (let c = 0; c < numCols; c++) {
    switch (dataTypes[c]) {
      case 0:
        dataSize += rowCount;
        break;
      case 1:
      // INT32
      case 3:
      // FLOAT
      case 9:
        dataSize += rowCount * 4;
        break;
      case 2:
      // INT64
      case 4:
      // DOUBLE
      case 8:
        dataSize += rowCount * 8;
        break;
      case 5:
      // TEXT
      case 11: {
        let lastStr = null;
        let lastLen = 0;
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            dataSize += 4;
            continue;
          }
          const str = typeof v === "string" ? v : String(v);
          if (str !== lastStr) {
            lastLen = Buffer.byteLength(str, "utf8");
            lastStr = str;
          }
          dataSize += 4 + lastLen;
        }
        break;
      }
      case 10: {
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          dataSize += 4 + (v === null || v === void 0 ? 0 : blobByteLength(v));
        }
        break;
      }
      default:
        throw new Error(`Unsupported data type: ${dataTypes[c]}`);
    }
  }
  const buffer = Buffer.allocUnsafe(dataSize + numCols * (1 + bitmapBytes));
  let off = 0;
  let bmOff = dataSize;
  for (let c = 0; c < numCols; c++) {
    const flagPos = bmOff;
    buffer[flagPos] = 0;
    let hasNull = false;
    const markNull = (r) => {
      if (!hasNull) {
        hasNull = true;
        buffer[flagPos] = 1;
        buffer.fill(0, flagPos + 1, flagPos + 1 + bitmapBytes);
      }
      buffer[flagPos + 1 + (r >>> 3)] |= 1 << (r & 7);
    };
    switch (dataTypes[c]) {
      case 0:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer[off] = 0;
          } else {
            buffer[off] = v ? 1 : 0;
          }
          off += 1;
        }
        break;
      case 1:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeInt32BE(0, off);
          } else {
            buffer.writeInt32BE(v, off);
          }
          off += 4;
        }
        break;
      case 2:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeInt32BE(0, off);
            buffer.writeUInt32BE(0, off + 4);
          } else {
            writeInt64BE(buffer, v, off);
          }
          off += 8;
        }
        break;
      case 3:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeFloatBE(0, off);
          } else {
            buffer.writeFloatBE(v, off);
          }
          off += 4;
        }
        break;
      case 4:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeDoubleBE(0, off);
          } else {
            buffer.writeDoubleBE(v, off);
          }
          off += 8;
        }
        break;
      case 5:
      // TEXT
      case 11: {
        let lastStr = null;
        let lastBuf = null;
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeInt32BE(0, off);
            off += 4;
            continue;
          }
          const str = typeof v === "string" ? v : String(v);
          if (str !== lastStr || lastBuf === null) {
            lastBuf = Buffer.from(str, "utf8");
            lastStr = str;
          }
          buffer.writeInt32BE(lastBuf.length, off);
          off += 4;
          lastBuf.copy(buffer, off);
          off += lastBuf.length;
        }
        break;
      }
      case 8:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeInt32BE(0, off);
            buffer.writeUInt32BE(0, off + 4);
          } else {
            writeInt64BE(buffer, v instanceof Date ? v.getTime() : v, off);
          }
          off += 8;
        }
        break;
      case 9:
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeInt32BE(0, off);
          } else {
            buffer.writeInt32BE((0, import_DataTypes.parseDateToInt)(v), off);
          }
          off += 4;
        }
        break;
      case 10: {
        for (let r = 0; r < rowCount; r++) {
          const v = values[r][c];
          if (v === null || v === void 0) {
            markNull(r);
            buffer.writeInt32BE(0, off);
            off += 4;
            continue;
          }
          const len = blobByteLength(v);
          buffer.writeInt32BE(len, off);
          off += 4;
          if (Buffer.isBuffer(v)) {
            v.copy(buffer, off);
          } else if (v instanceof Uint8Array) {
            buffer.set(v, off);
          } else if (typeof v === "string") {
            buffer.write(v, off, "utf8");
          } else if (isArrayBufferLike(v)) {
            buffer.set(new Uint8Array(v), off);
          } else {
            for (let i = 0; i < len; i++) {
              buffer[off + i] = v[i];
            }
          }
          off += len;
        }
        break;
      }
      default:
        throw new Error(`Unsupported data type: ${dataTypes[c]}`);
    }
    bmOff = flagPos + 1 + (hasNull ? bitmapBytes : 0);
  }
  return buffer.subarray(0, bmOff);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  serializeBlobColumn,
  serializeBooleanColumn,
  serializeColumnFast,
  serializeDateColumn,
  serializeDoubleColumn,
  serializeFloatColumn,
  serializeInt32Column,
  serializeInt64Column,
  serializeTabletValuesFast,
  serializeTextColumn,
  serializeTimestampColumn,
  serializeTimestamps,
  writeInt64BE
});
//# sourceMappingURL=FastSerializer.js.map
