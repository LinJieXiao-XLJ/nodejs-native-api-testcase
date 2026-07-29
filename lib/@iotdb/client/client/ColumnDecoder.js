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
var ColumnDecoder_exports = {};
__export(ColumnDecoder_exports, {
  BaseColumnDecoder: () => BaseColumnDecoder,
  ColumnDeserializer: () => ColumnDeserializer,
  ColumnEncoding: () => ColumnEncoding
});
module.exports = __toCommonJS(ColumnDecoder_exports);
var import_DataTypes = require("../utils/DataTypes");
var ColumnEncoding = /* @__PURE__ */ ((ColumnEncoding2) => {
  ColumnEncoding2[ColumnEncoding2["ByteArray"] = 0] = "ByteArray";
  ColumnEncoding2[ColumnEncoding2["Int32Array"] = 1] = "Int32Array";
  ColumnEncoding2[ColumnEncoding2["Int64Array"] = 2] = "Int64Array";
  ColumnEncoding2[ColumnEncoding2["BinaryArray"] = 3] = "BinaryArray";
  ColumnEncoding2[ColumnEncoding2["Rle"] = 4] = "Rle";
  return ColumnEncoding2;
})(ColumnEncoding || {});
class ColumnDeserializer {
  /**
   * Deserialize null indicators (bitmap) for a column
   * Format: 1 byte flag (0=no nulls, 1=has nulls) + optional bitmap
   */
  static deserializeNullIndicators(buffer, offset, positionCount) {
    const mayHaveNull = buffer.readUInt8(offset) !== 0;
    let bytesRead = 1;
    if (!mayHaveNull) {
      return { nullIndicators: null, bytesRead };
    }
    const { values, bytesRead: bitmapBytes } = this.deserializeBooleanArray(
      buffer,
      offset + 1,
      positionCount
    );
    bytesRead += bitmapBytes;
    return { nullIndicators: values, bytesRead };
  }
  /**
   * Deserialize boolean array from packed bitmap
   * Each byte stores 8 boolean values (1 bit per value)
   */
  static deserializeBooleanArray(buffer, offset, size) {
    const packedSize = Math.ceil(size / 8);
    const values = new Array(size);
    let currentByte = 0;
    const fullGroups = size & ~7;
    for (let pos = 0; pos < fullGroups; pos += 8) {
      const b = buffer.readUInt8(offset + currentByte++);
      values[pos + 0] = (b & 128) !== 0;
      values[pos + 1] = (b & 64) !== 0;
      values[pos + 2] = (b & 32) !== 0;
      values[pos + 3] = (b & 16) !== 0;
      values[pos + 4] = (b & 8) !== 0;
      values[pos + 5] = (b & 4) !== 0;
      values[pos + 6] = (b & 2) !== 0;
      values[pos + 7] = (b & 1) !== 0;
    }
    if (size % 8 !== 0) {
      const b = buffer.readUInt8(offset + currentByte++);
      let mask = 128;
      for (let pos = fullGroups; pos < size; pos++) {
        values[pos] = (b & mask) !== 0;
        mask >>= 1;
      }
    }
    return { values, bytesRead: packedSize };
  }
}
class Int32ArrayColumnDecoder {
  readColumn(buffer, offset, dataType, positionCount) {
    let currentOffset = offset;
    const { nullIndicators, bytesRead: nullBytes } = ColumnDeserializer.deserializeNullIndicators(
      buffer,
      currentOffset,
      positionCount
    );
    currentOffset += nullBytes;
    const values = new Array(positionCount);
    switch (dataType) {
      case 1:
        for (let i = 0; i < positionCount; i++) {
          if (nullIndicators && nullIndicators[i]) {
            values[i] = null;
            continue;
          }
          values[i] = buffer.readInt32BE(currentOffset);
          currentOffset += 4;
        }
        break;
      case 9:
        for (let i = 0; i < positionCount; i++) {
          if (nullIndicators && nullIndicators[i]) {
            values[i] = null;
            continue;
          }
          values[i] = (0, import_DataTypes.parseIntToDate)(buffer.readInt32BE(currentOffset));
          currentOffset += 4;
        }
        break;
      case 3:
        for (let i = 0; i < positionCount; i++) {
          if (nullIndicators && nullIndicators[i]) {
            values[i] = null;
            continue;
          }
          values[i] = buffer.readFloatBE(currentOffset);
          currentOffset += 4;
        }
        break;
      default:
        throw new Error(
          `Invalid data type ${dataType} for Int32ArrayColumnDecoder`
        );
    }
    return {
      column: {
        dataType,
        encoding: 1 /* Int32Array */,
        values,
        nullIndicators,
        positionCount
      },
      bytesRead: currentOffset - offset
    };
  }
}
class Int64ArrayColumnDecoder {
  readColumn(buffer, offset, dataType, positionCount) {
    let currentOffset = offset;
    const { nullIndicators, bytesRead: nullBytes } = ColumnDeserializer.deserializeNullIndicators(
      buffer,
      currentOffset,
      positionCount
    );
    currentOffset += nullBytes;
    const values = new Array(positionCount);
    switch (dataType) {
      case 2:
      // INT64
      case 8:
        for (let i = 0; i < positionCount; i++) {
          if (nullIndicators && nullIndicators[i]) {
            values[i] = null;
            continue;
          }
          values[i] = buffer.readBigInt64BE(currentOffset);
          currentOffset += 8;
        }
        break;
      case 4:
        for (let i = 0; i < positionCount; i++) {
          if (nullIndicators && nullIndicators[i]) {
            values[i] = null;
            continue;
          }
          values[i] = buffer.readDoubleBE(currentOffset);
          currentOffset += 8;
        }
        break;
      default:
        throw new Error(
          `Invalid data type ${dataType} for Int64ArrayColumnDecoder`
        );
    }
    return {
      column: {
        dataType,
        encoding: 2 /* Int64Array */,
        values,
        nullIndicators,
        positionCount
      },
      bytesRead: currentOffset - offset
    };
  }
}
class ByteArrayColumnDecoder {
  readColumn(buffer, offset, dataType, positionCount) {
    if (dataType !== 0) {
      throw new Error(
        `Invalid data type ${dataType} for ByteArrayColumnDecoder`
      );
    }
    let currentOffset = offset;
    const { nullIndicators, bytesRead: nullBytes } = ColumnDeserializer.deserializeNullIndicators(
      buffer,
      currentOffset,
      positionCount
    );
    currentOffset += nullBytes;
    const { values, bytesRead: boolBytes } = ColumnDeserializer.deserializeBooleanArray(
      buffer,
      currentOffset,
      positionCount
    );
    currentOffset += boolBytes;
    return {
      column: {
        dataType,
        encoding: 0 /* ByteArray */,
        values,
        nullIndicators,
        positionCount
      },
      bytesRead: currentOffset - offset
    };
  }
}
class BinaryArrayColumnDecoder {
  readColumn(buffer, offset, dataType, positionCount) {
    if (dataType !== 5 && dataType !== 10 && dataType !== 11) {
      throw new Error(
        `Invalid data type ${dataType} for BinaryArrayColumnDecoder`
      );
    }
    let currentOffset = offset;
    const { nullIndicators, bytesRead: nullBytes } = ColumnDeserializer.deserializeNullIndicators(
      buffer,
      currentOffset,
      positionCount
    );
    currentOffset += nullBytes;
    const values = new Array(positionCount);
    for (let i = 0; i < positionCount; i++) {
      if (nullIndicators && nullIndicators[i]) {
        values[i] = null;
        continue;
      }
      const length = buffer.readInt32BE(currentOffset);
      currentOffset += 4;
      const data = buffer.slice(currentOffset, currentOffset + length);
      currentOffset += length;
      if (dataType === 10) {
        values[i] = data;
      } else {
        values[i] = data.toString("utf8");
      }
    }
    return {
      column: {
        dataType,
        encoding: 3 /* BinaryArray */,
        values,
        nullIndicators,
        positionCount
      },
      bytesRead: currentOffset - offset
    };
  }
}
class RunLengthColumnDecoder {
  readColumn(buffer, offset, dataType, positionCount) {
    let currentOffset = offset;
    const innerEncoding = buffer.readUInt8(currentOffset);
    currentOffset += 1;
    const innerDecoder = BaseColumnDecoder.getDecoder(innerEncoding);
    const { column: innerColumn, bytesRead: innerBytes } = innerDecoder.readColumn(buffer, currentOffset, dataType, 1);
    currentOffset += innerBytes;
    const singleValue = innerColumn.values[0];
    const values = new Array(positionCount).fill(singleValue);
    const isNull = innerColumn.nullIndicators && innerColumn.nullIndicators[0];
    const nullIndicators = isNull ? new Array(positionCount).fill(true) : null;
    return {
      column: {
        dataType,
        encoding: 4 /* Rle */,
        values,
        nullIndicators,
        positionCount
      },
      bytesRead: currentOffset - offset
    };
  }
}
class BaseColumnDecoder {
  static getDecoder(encoding) {
    const decoder = this.decoders.get(encoding);
    if (!decoder) {
      throw new Error(`Unsupported encoding: ${encoding}`);
    }
    return decoder;
  }
}
BaseColumnDecoder.decoders = /* @__PURE__ */ new Map([
  [1 /* Int32Array */, new Int32ArrayColumnDecoder()],
  [2 /* Int64Array */, new Int64ArrayColumnDecoder()],
  [0 /* ByteArray */, new ByteArrayColumnDecoder()],
  [3 /* BinaryArray */, new BinaryArrayColumnDecoder()],
  [4 /* Rle */, new RunLengthColumnDecoder()]
]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseColumnDecoder,
  ColumnDeserializer,
  ColumnEncoding
});
//# sourceMappingURL=ColumnDecoder.js.map
