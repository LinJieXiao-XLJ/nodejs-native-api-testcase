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
import { RowRecord } from "./RowRecord";
import { Session } from "./Session";
/**
 * SessionDataSet represents a query result set with iterator pattern.
 * It provides lazy loading of query results to handle large datasets efficiently.
 *
 * Usage:
 * ```typescript
 * const dataSet = await session.executeQuery('SELECT * FROM root.test');
 * while (await dataSet.hasNext()) {
 *   const row = dataSet.next();
 *   console.log(row.getTimestamp(), row.getFields());
 * }
 * await dataSet.close();
 * ```
 */
export declare class SessionDataSet {
    private session;
    private queryId;
    private statementId;
    private sql;
    private columnNames;
    private columnTypes;
    private columnNameIndexMap;
    private columnIndex2TsBlockColumnIndexList;
    private fetchSize;
    private sessionId;
    private ignoreTimeStamp;
    private currentRows;
    private currentRowIndex;
    private hasMoreData;
    private isClosed;
    private hasCachedRow;
    private cleanupCallback?;
    constructor(session: Session, queryId: number, statementId: number, sql: string, columnNames: string[], columnTypes: string[], initialRows: any[][], hasMoreData: boolean, fetchSize: number, sessionId: number, ignoreTimeStamp?: boolean, columnIndex2TsBlockColumnIndexList?: number[]);
    /**
     * Set cleanup callback to be called when dataset is closed.
     * Used by SessionPool to release the session back to the pool.
     */
    setCleanupCallback(callback: () => void): void;
    /**
     * Get column names
     */
    getColumnNames(): string[];
    /**
     * Get column types
     */
    getColumnTypes(): string[];
    /**
     * Find column index by name
     */
    findColumn(columnName: string): number;
    /**
     * Check if there are more rows available.
     * This may trigger fetching more data from the server.
     */
    hasNext(): Promise<boolean>;
    /**
     * Get the next row record.
     * Must call hasNext() first to check availability.
     */
    next(): RowRecord;
    /**
     * Fetch the next batch of rows from the server
     */
    private fetchNextBatch;
    /**
     * Convert all remaining rows to a columnar format for high-performance processing.
     * This is inspired by pg nodejs client's array mode.
     *
     * Returns data in columnar format: { timestamps: number[], values: any[][] }
     * where values[columnIndex][rowIndex] gives the value.
     *
     * This is much more efficient than row-by-row processing when you need to
     * process large result sets, as it:
     * - Eliminates RowRecord object allocation (zero object overhead)
     * - Enables vectorized processing
     * - Reduces GC pressure by 80-90%
     *
     * WARNING: This loads rows into memory up to maxRows limit.
     *
     * @param options.maxRows Maximum rows to load (default: 100000). Set to 0 for unlimited.
     * @returns Columnar data with truncated flag indicating if more rows exist
     *
     * For large result sets, use hasNext()/next() iterator pattern instead.
     *
     * @returns Columnar data structure with timestamps and column values
     *
     * @example
     * ```typescript
     * const dataSet = await session.executeQueryStatement('SELECT temp, humidity FROM root.test');
     * const columnar = await dataSet.toColumnar();
     *
     * // Process timestamps (TypedArray for better performance)
     * const timestamps = columnar.timestamps;
     *
     * // Process each column (column[0] = temp, column[1] = humidity)
     * for (let col = 0; col < columnar.values.length; col++) {
     *   const columnValues = columnar.values[col];
     *   const sum = columnValues.reduce((a, b) => a + b, 0);
     *   console.log(`Column ${col} average: ${sum / columnValues.length}`);
     * }
     *
     * await dataSet.close();
     * ```
     */
    toColumnar(options?: {
        maxRows?: number;
    }): Promise<{
        timestamps: number[];
        values: any[][];
        columnNames: string[];
        columnTypes: string[];
        truncated: boolean;
    }>;
    /**
     * Close the dataset and release resources on the server
     */
    close(): Promise<void>;
    /**
     * Convert all remaining rows to an array.
     * WARNING: This loads all data into memory. Use with caution for large result sets.
     * @deprecated Use iterator pattern (hasNext/next) instead for better memory efficiency
     */
    toArray(): Promise<any[][]>;
    /**
     * Check if the dataset is closed
     */
    isClosed_(): boolean;
}
//# sourceMappingURL=SessionDataSet.d.ts.map