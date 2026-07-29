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
 * Represents a single row of data from a query result
 */
export declare class RowRecord {
    private timestamp;
    private fields;
    private columnNames;
    private columnTypes;
    private columnNameIndexMap;
    constructor(timestamp: number, fields: any[], columnNames: string[], columnTypes: string[], columnNameIndexMap: Map<string, number>);
    /**
     * Get the timestamp of this row
     */
    getTimestamp(): number;
    /**
     * Get all field values
     */
    getFields(): any[];
    /**
     * Get column names
     */
    getColumnNames(): string[];
    /**
     * Get value by column index
     */
    getValueByIndex(index: number): any;
    /**
     * Get value by column name
     */
    getValue(columnName: string): any;
    /**
     * Check if value is null by index
     */
    isNullByIndex(index: number): boolean;
    /**
     * Check if value is null by column name
     */
    isNull(columnName: string): boolean;
    /**
     * Get string value by index
     */
    getStringByIndex(index: number): string;
    /**
     * Get string value by column name
     */
    getString(columnName: string): string;
    /**
     * Get integer value by index
     */
    getIntByIndex(index: number): number;
    /**
     * Get integer value by column name
     */
    getInt(columnName: string): number;
    /**
     * Get long value by index
     */
    getLongByIndex(index: number): number;
    /**
     * Get long value by column name
     */
    getLong(columnName: string): number;
    /**
     * Get float value by index
     */
    getFloatByIndex(index: number): number;
    /**
     * Get float value by column name
     */
    getFloat(columnName: string): number;
    /**
     * Get double value by index
     */
    getDoubleByIndex(index: number): number;
    /**
     * Get double value by column name
     */
    getDouble(columnName: string): number;
    /**
     * Get boolean value by index
     */
    getBooleanByIndex(index: number): boolean;
    /**
     * Get boolean value by column name
     */
    getBoolean(columnName: string): boolean;
    /**
     * Convert row to array (timestamp + fields)
     */
    toArray(): any[];
    /**
     * Convert row to string representation
     */
    toString(): string;
}
//# sourceMappingURL=RowRecord.d.ts.map