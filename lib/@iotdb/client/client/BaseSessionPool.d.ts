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
import { Session, TreeTablet, TableTablet, ITreeTablet, ITableTablet, SessionDataSet } from "./Session";
import { PoolConfig, EndPoint } from "../utils/Config";
import { RedirectCache } from "./RedirectCache";
import Denque from "denque";
interface PooledSession {
    session: Session;
    lastUsed: number;
    inUse: boolean;
}
/**
 * Base class for session pooling with common functionality
 * Provides connection pooling, round-robin load balancing, and automatic cleanup
 */
export declare abstract class BaseSessionPool {
    protected config: PoolConfig;
    protected endPoints: EndPoint[];
    protected pool: PooledSession[];
    protected waitQueue: Denque<(session: Session) => void>;
    protected idleSessions: Denque<PooledSession>;
    protected activeSessions: Set<PooledSession>;
    protected currentEndPointIndex: number;
    protected cleanupInterval: ReturnType<typeof setInterval> | null;
    protected redirectCache: RedirectCache;
    protected endPointToSession: Map<string, PooledSession>;
    constructor(hostsOrConfig: string | string[] | PoolConfig, port?: number, config?: Partial<PoolConfig>);
    /**
     * Get the name of the pool for logging purposes
     */
    protected abstract getPoolName(): string;
    /**
     * Create a new session with pool-specific initialization
     */
    protected abstract createPoolSession(): Promise<Session>;
    init(): Promise<void>;
    private createSession;
    protected getNextEndPoint(): EndPoint;
    /**
     * Extract device ID from tablet for caching
     */
    protected extractDeviceId(tablet: TreeTablet | ITreeTablet | TableTablet | ITableTablet): string;
    /**
     * Get or create a session for a specific endpoint
     */
    protected getSessionForEndpoint(endpoint: EndPoint): Promise<Session>;
    /**
     * Get a session from the pool
     * The session must be released back to the pool using releaseSession() after use
     */
    getSession(): Promise<Session>;
    /**
     * Release a session back to the pool
     * Should be called after getSession() when the session is no longer needed
     */
    releaseSession(session: Session): void;
    private cleanupIdleSessions;
    /**
     * Execute a query statement and return SessionDataSet
     * Session is held until dataset.close() is called
     */
    executeQueryStatement(sql: string, timeoutMs?: number): Promise<SessionDataSet>;
    executeNonQueryStatement(sql: string): Promise<void>;
    /**
     * Insert tablet (supports both tree and table models)
     * @param tablet TreeTablet for tree model or TableTablet for table model
     */
    insertTablet(tablet: TreeTablet | ITreeTablet | TableTablet | ITableTablet): Promise<void>;
    close(): Promise<void>;
    getPoolSize(): number;
    getAvailableSize(): number;
    getInUseSize(): number;
    /**
     * Get total number of sessions in the pool
     * @alias getPoolSize
     */
    get totalCount(): number;
    /**
     * Get number of idle sessions
     * @alias getAvailableSize
     */
    get idleCount(): number;
    /**
     * Get number of active (in-use) sessions
     * @alias getInUseSize
     */
    get activeCount(): number;
    /**
     * Get number of requests waiting for a session
     */
    get waitingCount(): number;
    /**
     * Get comprehensive pool statistics
     */
    getPoolStats(): {
        total: number;
        idle: number;
        active: number;
        waiting: number;
        endpoints: number;
        redirectCacheSize: number;
    };
    /**
     * Insert multiple tablets concurrently using the pool.
     * This method optimizes for Node.js async patterns by:
     * 1. Pre-acquiring sessions to avoid contention
     * 2. Distributing tablets across sessions for parallel execution
     * 3. Automatically releasing sessions after completion
     *
     * This is the recommended way to achieve high throughput in Node.js.
     *
     * @param tablets Array of tablets to insert
     * @param options Configuration options
     * @param options.concurrency Number of concurrent workers (default: pool size or 10)
     * @returns Promise that resolves when all inserts complete
     *
     * @example
     * ```typescript
     * const tablets = generateTablets(1000);
     * // Insert 1000 tablets using pool's concurrent execution
     * await pool.insertTabletsParallel(tablets, { concurrency: 20 });
     * ```
     */
    insertTabletsParallel(tablets: (TreeTablet | ITreeTablet | TableTablet | ITableTablet)[], options?: {
        concurrency?: number;
    }): Promise<void>;
    /**
     * Execute multiple operations concurrently using the pool.
     * This is a generic utility for running any async operations in parallel
     * while respecting pool size limits.
     *
     * @param items Array of items to process
     * @param operation Async function to execute for each item
     * @param options Configuration options
     * @param options.concurrency Number of concurrent workers (default: pool size or 10)
     * @param options.stopOnError Whether to stop processing on first error (default: false)
     * @returns Results array (in same order as input items).
     *          Note: When stopOnError=false, failed operations will have `undefined` at their index.
     *          Check array entries for undefined to detect failures.
     *
     * @example
     * ```typescript
     * const devices = ['d1', 'd2', 'd3'];
     * const results = await pool.executeParallel(
     *   devices,
     *   async (session, deviceId) => {
     *     await session.executeNonQueryStatement(`CREATE TIMESERIES root.sg.${deviceId}...`);
     *     return deviceId;
     *   },
     *   { concurrency: 5 }
     * );
     * // Check for failures
     * const failures = results.filter((r, i) => r === undefined);
     * ```
     */
    executeParallel<T, R>(items: T[], operation: (session: Session, item: T, index: number) => Promise<R>, options?: {
        concurrency?: number;
        stopOnError?: boolean;
    }): Promise<(R | undefined)[]>;
}
export {};
//# sourceMappingURL=BaseSessionPool.d.ts.map