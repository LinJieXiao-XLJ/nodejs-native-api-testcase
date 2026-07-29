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
 * Options for concurrent execution
 */
export interface ConcurrentOptions {
    /** Maximum concurrent operations (default: 10) */
    concurrency?: number;
    /** Stop on first error (default: false) */
    stopOnError?: boolean;
    /** Log progress every N items (default: 0 = disabled) */
    logProgressEvery?: number;
}
/**
 * Result of concurrent execution with statistics
 */
export interface ConcurrentResult<T> {
    /**
     * Results array (same order as input).
     * Note: Failed operations will have `undefined` at their index.
     * Use `errors` array to correlate failures with their indices.
     */
    results: (T | undefined)[];
    /** Total execution time in milliseconds */
    durationMs: number;
    /** Number of successful operations */
    successCount: number;
    /** Number of failed operations */
    failureCount: number;
    /** Array of errors with their indices */
    errors: {
        index: number;
        error: Error;
    }[];
}
/**
 * Execute async operations concurrently with controlled parallelism.
 * This is the core utility for high-throughput Node.js operations.
 *
 * Unlike Java's ExecutorService with thread pools, this uses Promise-based
 * concurrency which is more efficient for I/O-bound operations like
 * database writes.
 *
 * @param items Array of items to process
 * @param operation Async function to execute for each item
 * @param options Concurrency configuration
 * @returns Detailed execution results
 *
 * @example
 * ```typescript
 * // Process 1000 items with max 20 concurrent operations
 * const result = await executeConcurrent(
 *   items,
 *   async (item, index) => {
 *     await someAsyncOperation(item);
 *     return `Processed ${index}`;
 *   },
 *   { concurrency: 20, logProgressEvery: 100 }
 * );
 * console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
 * ```
 */
export declare function executeConcurrent<T, R>(items: T[], operation: (item: T, index: number) => Promise<R>, options?: ConcurrentOptions): Promise<ConcurrentResult<R>>;
/**
 * Execute operations in batches with concurrent execution within each batch.
 * Useful when you need to respect rate limits or ensure ordering between batches.
 *
 * @param items Array of items to process
 * @param batchSize Number of items per batch
 * @param operation Async function to execute for each item
 * @param options Concurrency configuration (applied within each batch)
 * @returns Combined results from all batches
 *
 * @example
 * ```typescript
 * // Process items in batches of 100, with 10 concurrent operations per batch
 * const result = await executeBatched(
 *   items,
 *   100,  // batch size
 *   async (item) => await process(item),
 *   { concurrency: 10 }
 * );
 * ```
 */
export declare function executeBatched<T, R>(items: T[], batchSize: number, operation: (item: T, index: number) => Promise<R>, options?: ConcurrentOptions): Promise<ConcurrentResult<R>>;
/**
 * Chunk an array into smaller arrays of specified size.
 * Useful for manual batch processing.
 *
 * @param array Array to chunk
 * @param size Maximum size of each chunk
 * @returns Array of chunks
 *
 * @example
 * ```typescript
 * const tablets = generateTablets(1000);
 * const chunks = chunkArray(tablets, 100);
 * // chunks.length === 10, each chunk has 100 tablets
 * ```
 */
export declare function chunkArray<T>(array: T[], size: number): T[][];
/**
 * Create a promise-based semaphore for limiting concurrent operations.
 * This is useful when you need fine-grained control over concurrency.
 *
 * @param limit Maximum concurrent operations
 * @returns Semaphore object with acquire/release methods
 *
 * @example
 * ```typescript
 * const sem = createSemaphore(5);  // Max 5 concurrent
 *
 * async function processItem(item) {
 *   await sem.acquire();
 *   try {
 *     await doWork(item);
 *   } finally {
 *     sem.release();
 *   }
 * }
 * ```
 */
export declare function createSemaphore(limit: number): {
    acquire(): Promise<void>;
    release(): void;
    readonly available: number;
    readonly waiting: number;
};
//# sourceMappingURL=ConcurrentExecutor.d.ts.map