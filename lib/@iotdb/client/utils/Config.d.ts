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
export declare const SQL_DIALECT_TREE = "tree";
export declare const SQL_DIALECT_TABLE = "table";
export interface EndPoint {
    host: string;
    port: number;
}
/**
 * Internal config used by Connection class (includes internal-only fields)
 */
export interface InternalConfig extends Config {
    sqlDialect?: string;
}
/**
 * Parse nodeUrls from string array format (e.g., ["host1:6667", "host2:6668"])
 * to EndPoint array format
 */
export declare function parseNodeUrls(nodeUrls: string[]): EndPoint[];
export interface Config {
    host?: string;
    port?: number;
    nodeUrls?: string[] | EndPoint[];
    username?: string;
    password?: string;
    database?: string;
    timezone?: string;
    fetchSize?: number;
    enableSSL?: boolean;
    sslOptions?: SSLOptions;
    /**
     * Enable the optimized tablet serialization path: single-pass,
     * single-buffer writes with inline null bitmaps (no intermediate
     * per-column buffers or Buffer.concat), BigInt-free int64 writes.
     * Produces byte-identical wire output to the legacy path.
     *
     * @default true
     */
    enableFastSerialization?: boolean;
}
export interface SSLOptions {
    ca?: Buffer;
    cert?: Buffer;
    key?: Buffer;
    rejectUnauthorized?: boolean;
}
export interface PoolConfig extends Config {
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTime?: number;
    waitTimeout?: number;
    /**
     * Enable client-side redirection optimization.
     * When enabled, the client caches device→endpoint mappings
     * and routes writes directly to optimal nodes.
     *
     * @default true
     * @requires Multi-node IoTDB cluster
     */
    enableRedirection?: boolean;
    /**
     * Time-to-live for cached redirect mappings (milliseconds).
     * Set to 0 for no expiration.
     * Recommended: 300000 (5 minutes)
     *
     * @default 300000
     */
    redirectCacheTTL?: number;
}
export declare const DEFAULT_CONFIG: Partial<Config>;
export declare const DEFAULT_POOL_CONFIG: Partial<PoolConfig>;
/**
 * Builder class for constructing Session and SessionPool configurations
 */
export declare class ConfigBuilder {
    private config;
    constructor();
    host(host: string): this;
    port(port: number): this;
    nodeUrls(nodeUrls: string[] | EndPoint[]): this;
    username(username: string): this;
    password(password: string): this;
    database(database: string): this;
    timezone(timezone: string): this;
    fetchSize(fetchSize: number): this;
    enableSSL(enable: boolean): this;
    sslOptions(sslOptions: SSLOptions): this;
    build(): Config;
}
/**
 * Builder class for constructing SessionPool configurations
 */
export declare class PoolConfigBuilder extends ConfigBuilder {
    private poolConfig;
    constructor();
    host(host: string): this;
    port(port: number): this;
    nodeUrls(nodeUrls: string[] | EndPoint[]): this;
    username(username: string): this;
    password(password: string): this;
    database(database: string): this;
    timezone(timezone: string): this;
    fetchSize(fetchSize: number): this;
    enableSSL(enable: boolean): this;
    sslOptions(sslOptions: SSLOptions): this;
    maxPoolSize(size: number): this;
    minPoolSize(size: number): this;
    maxIdleTime(time: number): this;
    waitTimeout(timeout: number): this;
    build(): PoolConfig;
}
//# sourceMappingURL=Config.d.ts.map