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
 * Column encoding types matching Apache IoTDB ColumnEncoding enum
 */
export declare enum ColumnEncoding {
    ByteArray = 0,// For BOOLEAN
    Int32Array = 1,// For INT32, DATE, FLOAT
    Int64Array = 2,// For INT64, TIMESTAMP, DOUBLE
    BinaryArray = 3,// For TEXT, STRING, BLOB
    Rle = 4
}
/**
 * Decoded column interface - stores all values for a column
 */
export interface Column {
    dataType: number;
    encoding: ColumnEncoding;
    values: any[];
    nullIndicators: boolean[] | null;
    positionCount: number;
}
/**
 * Column decoder interface
 */
export interface ColumnDecoder {
    readColumn(buffer: Buffer, offset: number, dataType: number, positionCount: number): {
        column: Column;
        bytesRead: number;
    };
}
/**
 * Helper functions for deserializing column data
 */
export declare class ColumnDeserializer {
    /**
     * Deserialize null indicators (bitmap) for a column
     * Format: 1 byte flag (0=no nulls, 1=has nulls) + optional bitmap
     */
    static deserializeNullIndicators(buffer: Buffer, offset: number, positionCount: number): {
        nullIndicators: boolean[] | null;
        bytesRead: number;
    };
    /**
     * Deserialize boolean array from packed bitmap
     * Each byte stores 8 boolean values (1 bit per value)
     */
    static deserializeBooleanArray(buffer: Buffer, offset: number, size: number): {
        values: boolean[];
        bytesRead: number;
    };
}
/**
 * Base column decoder factory (declared after decoder classes)
 */
export declare class BaseColumnDecoder {
    private static decoders;
    static getDecoder(encoding: ColumnEncoding): ColumnDecoder;
}
//# sourceMappingURL=ColumnDecoder.d.ts.map