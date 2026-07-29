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
import { Connection } from "../connection/Connection";
import { Config, EndPoint } from "../utils/Config";
import { SessionDataSet } from "./SessionDataSet";
import { RowRecord } from "./RowRecord";
/**
 * @deprecated QueryResult is deprecated. Use SessionDataSet instead.
 */
export interface QueryResult {
    columns: string[];
    dataTypes: string[];
    rows: any[][];
    queryId?: number;
}
export { SessionDataSet, RowRecord };
/**
 * Column category for table model
 * Matches C# and Java IoTDB client definitions
 *
 * Note: TIME is reserved for internal use. When specifying columnCategories in TableTablet,
 * only use TAG, FIELD, and ATTRIBUTE. Timestamps are handled separately via the timestamps array.
 */
export declare enum ColumnCategory {
    TAG = 0,// Tag column - indexed for WHERE clause filtering (e.g., device_id, region_id)
    FIELD = 1,// Field column - measurement values (e.g., temperature, humidity)
    ATTRIBUTE = 2,// Attribute column - metadata not indexed (e.g., model, firmware_version)
    TIME = 3
}
/**
 * Tree model tablet interface - for timeseries model
 * Uses deviceId as the full path (e.g., "root.sg.device")
 */
export interface ITreeTablet {
    deviceId: string;
    measurements: string[];
    dataTypes: number[];
    timestamps: number[];
    values: any[][];
}
/**
 * Table model tablet interface - for relational/table model
 * Uses tableName and includes column categories
 */
export interface ITableTablet {
    tableName: string;
    columnNames: string[];
    columnTypes: number[];
    columnCategories: ColumnCategory[];
    timestamps: number[];
    values: any[][];
}
/**
 * Tree model tablet class with helper methods
 * Convenient for building tablets row-by-row
 */
export declare class TreeTablet implements ITreeTablet {
    deviceId: string;
    measurements: string[];
    dataTypes: number[];
    timestamps: number[];
    values: any[][];
    constructor(deviceId: string, measurements: string[], dataTypes: number[]);
    /**
     * Add a row to the tablet
     * @param timestamp - The timestamp for this row
     * @param values - Array of values, must match the length of measurements
     */
    addRow(timestamp: number, values: any[]): void;
}
/**
 * Table model tablet class with helper methods
 * Convenient for building tablets row-by-row
 */
export declare class TableTablet implements ITableTablet {
    tableName: string;
    columnNames: string[];
    columnTypes: number[];
    columnCategories: ColumnCategory[];
    timestamps: number[];
    values: any[][];
    constructor(tableName: string, columnNames: string[], columnTypes: number[], columnCategories: ColumnCategory[]);
    /**
     * Add a row to the tablet
     * @param timestamp - The timestamp for this row
     * @param values - Array of values, must match the length of columnNames
     */
    addRow(timestamp: number, values: any[]): void;
}
/**
 * @deprecated Use TreeTablet for tree model or TableTablet for table model instead
 */
export interface Tablet {
    deviceId: string;
    measurements: string[];
    dataTypes: number[];
    timestamps: number[];
    values: any[][];
}
export declare class Session {
    protected config: Config;
    protected connection: Connection;
    private lastRedirectEndpoint;
    constructor(config: Config);
    open(): Promise<void>;
    close(): Promise<void>;
    /**
     * Get and clear the last redirect endpoint recommendation.
     * Returns null if no redirect was recommended in the last operation.
     */
    getAndClearLastRedirect(): EndPoint | null;
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
    executeQueryStatement(sql: string, timeoutMs?: number): Promise<SessionDataSet>;
    executeNonQueryStatement(sql: string): Promise<void>;
    /**
     * Insert tablet (supports both tree and table models)
     * @param tablet TreeTablet for tree model or TableTablet for table model
     */
    insertTablet(tablet: TreeTablet | ITreeTablet | TableTablet | ITableTablet): Promise<void>;
    /**
     * Internal method to insert tree model tablet
     */
    private insertTreeTabletInternal;
    /**
     * Internal method to insert table model tablet
     */
    private insertTableTabletInternal;
    /**
     * Legacy timestamp serialization (for when enableFastSerialization=false)
     */
    private serializeTimestampsLegacy;
    protected serializeTabletValues(values: any[][], dataTypes: number[], rowCount: number): Buffer;
    protected serializeColumn(values: any[], dataType: number): Buffer;
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
    protected serializeBitMaps(bitMaps: (boolean[] | null)[], rowCount: number): Buffer;
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
    parseQueryResult(queryResult: Buffer[], _columnCount: number, dataTypes: string[], ignoreTimeStamp?: boolean, columnIndex2TsBlockColumnIndexList?: number[]): Promise<any[][]>;
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
    private derivePhysicalColumnTypes;
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
    private parseTsBlock;
    /**
     * Helper method to convert data type string to numeric code
     */
    private getDataTypeCode;
    /**
     * Helper method to determine row count from a buffer based on data type
     */
    private getRowCountFromBuffer;
    parseDataSet(dataset: any, _columnCount: number, dataTypes: string[]): Promise<any[][]>;
    private deserializeColumn;
    private isNull;
    isOpen(): boolean;
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
    insertTablets(tablets: (TreeTablet | ITreeTablet)[]): Promise<void>;
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
    insertTabletsParallel(tablets: (TreeTablet | ITreeTablet | TableTablet | ITableTablet)[], concurrency?: number): Promise<void>;
}
//# sourceMappingURL=Session.d.ts.map