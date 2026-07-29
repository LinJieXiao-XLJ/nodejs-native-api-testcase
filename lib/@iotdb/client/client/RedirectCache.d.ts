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
import { EndPoint } from "../utils/Config";
/**
 * Cache for device-to-endpoint redirect mappings.
 * Supports TTL-based expiration and LRU eviction.
 */
export declare class RedirectCache {
    private deviceToEndpoint;
    private ttl;
    private maxSize;
    constructor(ttl?: number, maxSize?: number);
    /**
     * Get cached endpoint for a device.
     * Returns null if not cached or expired.
     */
    get(deviceId: string): EndPoint | null;
    /**
     * Cache endpoint for a device.
     */
    set(deviceId: string, endpoint: EndPoint): void;
    /**
     * Remove cached endpoint for a device.
     */
    remove(deviceId: string): void;
    /**
     * Clear all cached mappings.
     */
    clear(): void;
    /**
     * Get cache statistics.
     */
    getStats(): {
        size: number;
        maxSize: number;
        ttl: number;
    };
}
//# sourceMappingURL=RedirectCache.d.ts.map