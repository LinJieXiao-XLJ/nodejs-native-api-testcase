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
import { Session } from "./Session";
import { PoolConfig } from "../utils/Config";
import { BaseSessionPool } from "./BaseSessionPool";
/**
 * TableSessionPool provides connection pooling optimized for table model operations
 * Automatically configures sessions for table mode by setting sql_dialect to 'table'
 * Uses TableSession instances which extend Session
 * Tracks database context across all sessions in the pool for table model operations
 */
export declare class TableSessionPool extends BaseSessionPool {
    private currentDatabase?;
    constructor(hostsOrConfig: string | string[] | PoolConfig, port?: number, config?: Partial<PoolConfig>);
    protected getPoolName(): string;
    protected createPoolSession(): Promise<Session>;
    /**
     * Override executeNonQueryStatement to track USE statements and sync database context
     * This is specific to table model - tree model doesn't need this
     */
    executeNonQueryStatement(sql: string): Promise<void>;
    /**
     * Synchronize database context to all idle sessions in the pool
     * This ensures all sessions use the same database after a USE statement
     * Only applies to table model - tree model doesn't need this
     * @param database - Database name to switch to
     */
    private syncDatabaseContextToPool;
    /**
     * Override getSession to return session from pool
     *
     * Database context is managed through a two-step process:
     * 1. During session creation (createPoolSession), the session gets the current database context
     * 2. When executeNonQueryStatement detects a USE statement, syncDatabaseContextToPool() is called
     *    to synchronize the new database context to all idle sessions in the pool
     *
     * This ensures all sessions maintain correct database context without needing to execute USE
     * on every getSession() call, which significantly improves performance in high-concurrency scenarios.
     */
    getSession(): Promise<Session>;
    /**
     * Get current database context
     * @returns Current database name or undefined
     */
    getCurrentDatabase(): string | undefined;
}
export type { QueryResult, Tablet, TreeTablet, TableTablet, ColumnCategory, } from "./Session";
export { TableSession } from "./TableSession";
//# sourceMappingURL=TableSessionPool.d.ts.map