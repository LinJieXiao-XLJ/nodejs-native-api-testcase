/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/**
 * Fast serialization utilities for IoTDB data types
 * Optimized for performance with:
 * - Single exact-size buffer allocation per tablet (no Buffer.concat re-copy)
 * - BigInt-free int64 writes (hi/lo 32-bit pair)
 * - Single-entry string encode cache (TAG columns repeat the same value)
 * - Minimal object allocation
 */
/**
 * Write a 64-bit big-endian signed integer without allocating a BigInt.
 *
 * For any safe integer v (positive or negative):
 *   hi = Math.floor(v / 2^32)  — arithmetic shift, sign-correct
 *   lo = v >>> 0               — ToUint32 performs the mod-2^32 reduction
 * so that hi * 2^32 + lo === v, which is exactly the two's complement
 * representation split into two 32-bit halves.
 *
 * Falls back to writeBigInt64BE for BigInt inputs and non-safe-integer
 * numbers (preserves legacy error behavior for invalid values like 1.5).
 */
export declare function writeInt64BE(buffer: Buffer, v: number | bigint, offset: number): void;
/**
 * Serialize BOOLEAN column (1 byte per value)
 */
export declare function serializeBooleanColumn(values: any[]): Buffer;
/**
 * Serialize INT32 column (4 bytes per value, big-endian)
 */
export declare function serializeInt32Column(values: any[]): Buffer;
/**
 * Serialize INT64 column (8 bytes per value, big-endian)
 * Optimized: BigInt-free hi/lo writes for number inputs
 */
export declare function serializeInt64Column(values: any[]): Buffer;
/**
 * Serialize FLOAT column (4 bytes per value, big-endian)
 */
export declare function serializeFloatColumn(values: any[]): Buffer;
/**
 * Serialize DOUBLE column (8 bytes per value, big-endian)
 */
export declare function serializeDoubleColumn(values: any[]): Buffer;
/**
 * Serialize TEXT/STRING column (4 bytes length + UTF-8 bytes per value)
 * Optimized: single-entry encode cache — TAG columns repeat the same string
 * for every row of a tablet, so the encoded Buffer is reused on consecutive
 * identical values instead of re-encoding.
 */
export declare function serializeTextColumn(values: any[]): Buffer;
/**
 * Serialize TIMESTAMP column (8 bytes per value, big-endian)
 * Handles both Date objects and numeric timestamps
 * Optimized: BigInt-free hi/lo writes
 */
export declare function serializeTimestampColumn(values: any[]): Buffer;
/**
 * Serialize DATE column (4 bytes per value, INT32 yyyyMMdd encoding)
 */
export declare function serializeDateColumn(values: any[]): Buffer;
/**
 * Serialize BLOB column (4 bytes length + binary data per value)
 * Two-pass approach to pre-calculate total size
 */
export declare function serializeBlobColumn(values: any[]): Buffer;
/**
 * Serialize timestamps array to buffer (used by insertTablet)
 * Optimized: BigInt-free hi/lo writes (timestamps are safe integers)
 */
export declare function serializeTimestamps(timestamps: number[]): Buffer;
/**
 * Fast column serializer dispatch
 * Maps data type to appropriate serialization function
 */
export declare function serializeColumnFast(values: any[], dataType: number): Buffer;
/**
 * Serialize a whole tablet's values (all columns + null bitmaps) into ONE buffer.
 *
 * Wire format (identical to the legacy per-column path):
 *   [col0 data][col1 data]...[colN data]
 *   then per column: [hasNull flag byte][bitmap bytes, only when flag=1]
 *   Bitmap: ceil(rowCount/8) bytes, LSB-first, bit=1 means NULL.
 *
 * Optimizations over the legacy path:
 * - No rows→columns transpose (reads values[row][col] directly)
 * - No per-column intermediate buffers or boolean[] bitmaps
 * - No trailing Buffer.concat (exact data size pre-computed; bitmap section
 *   allocated worst-case and trimmed with a zero-copy subarray)
 * - Null bitmaps are packed inline during the value pass; the flag byte
 *   stays 0 and no bitmap bytes are emitted when a column has no nulls
 *
 * @param values Row-major tablet values: values[rowIndex][colIndex]
 * @param dataTypes TSDataType code per column
 * @param rowCount Number of rows
 */
export declare function serializeTabletValuesFast(values: any[][], dataTypes: number[], rowCount: number): Buffer;
//# sourceMappingURL=FastSerializer.d.ts.map