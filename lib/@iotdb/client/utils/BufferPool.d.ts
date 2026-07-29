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
 * Buffer pool for reusing buffers to reduce GC pressure
 * Inspired by pg nodejs client's buffer management strategy
 *
 * @deprecated No longer used internally. The write path never called
 * release(), so the pool had a 0% hit rate and acquire() was pure overhead
 * over Buffer.allocUnsafe. Kept only because it is part of the public API
 * surface (exported from src/index.ts); may be removed in a future major
 * version.
 *
 * Key design principles:
 * 1. Size classes to minimize waste (powers of 2)
 * 2. Maximum pool size to prevent memory bloat
 * 3. Clear statistics for monitoring
 */
export declare class BufferPool {
    private static readonly SIZE_CLASSES;
    private static readonly MAX_BUFFERS_PER_CLASS;
    private pools;
    private stats;
    constructor();
    /**
     * Get a buffer of at least the requested size
     * Returns a pooled buffer if available, otherwise allocates new
     * @throws Error if buffer allocation fails (e.g., out of memory)
     */
    acquire(minSize: number): Buffer;
    /**
     * Return a buffer to the pool for reuse
     * Only pools buffers that fit in size classes
     */
    release(buffer: Buffer): void;
    /**
     * Find the appropriate size class for a requested size
     * Returns null if size is too large for pooling
     */
    private getSizeClass;
    /**
     * Get pool statistics
     */
    getStats(): {
        hitRate: string;
        pooledBuffers: number;
        hits: number;
        misses: number;
        allocations: number;
        returns: number;
    };
    /**
     * Clear all pooled buffers
     */
    clear(): void;
    /**
     * Log statistics (for debugging)
     */
    logStats(): void;
}
export declare const globalBufferPool: BufferPool;
//# sourceMappingURL=BufferPool.d.ts.map