# Node.js 原生接口用例导入审查（2026-11-05）

基线：`LinJieXiao-XLJ/nodejs-native-api-testcase` `main@1b77c8b`。共 **36** 条，与 Jest 实际执行的 36 条一致。

## 一、总体分布

| 模块 | 功能点路径 | 用例数 |
| --- | --- | --- |
| 树模型-会话 | `接口模块/Node.js 原生接口/树模型-会话` | 9 |
| 树模型-写入 | `接口模块/Node.js 原生接口/树模型-写入` | 4 |
| 树模型-连接池 | `接口模块/Node.js 原生接口/树模型-连接池` | 8 |
| 树模型-元数据 | `接口模块/Node.js 原生接口/树模型-元数据` | 4 |
| 树模型-数据类型 | `接口模块/Node.js 原生接口/树模型-数据类型` | 3 |
| 树模型-查询结果 | `接口模块/Node.js 原生接口/树模型-查询结果` | 1 |
| 表模型-Tablet 写入 | `接口模块/Node.js 原生接口/表模型-Tablet 写入` | 3 |
| 表模型-会话 | `接口模块/Node.js 原生接口/表模型-会话` | 4 |

## 二、用例清单

| # | PLM 用例名 | Jest target | 优先级 |
| --- | --- | --- | --- |
| 1 | Node 原生｜表模型-Tablet 写入：TableTablet addRow 添加数据 | `tests/table/test_table_insert.test.js::表模型 TableTablet TableTablet addRow 添加数据` | P1 |
| 2 | Node 原生｜表模型-Tablet 写入：TableTablet 构造 | `tests/table/test_table_insert.test.js::表模型 TableTablet TableTablet 构造` | P1 |
| 3 | Node 原生｜表模型-Tablet 写入：参数长度不一致抛异常 | `tests/table/test_table_insert.test.js::表模型 TableTablet 参数长度不一致抛异常` | P1 |
| 4 | Node 原生｜表模型-会话：TAG=0, FIELD=1, ATTRIBUTE=2, TIME=3 | `tests/table/test_table_session.test.js::ColumnCategory 枚举 TAG=0, FIELD=1, ATTRIBUTE=2, TIME=3` | P1 |
| 5 | Node 原生｜表模型-会话：TableSession 带 database 参数 | `tests/table/test_table_session.test.js::表模型 TableSession TableSession 带 database 参数` | P1 |
| 6 | Node 原生｜表模型-会话：TableSession 构造 | `tests/table/test_table_session.test.js::表模型 TableSession TableSession 构造` | P1 |
| 7 | Node 原生｜表模型-会话：TableSessionPool 构造 | `tests/table/test_table_session.test.js::表模型 TableSession TableSessionPool 构造` | P1 |
| 8 | Node 原生｜树模型-数据类型：10种类型值正确 | `tests/tree/test_datatypes.test.js::TSDataType 枚举 10种类型值正确` | P1 |
| 9 | Node 原生｜树模型-数据类型：INT64 用 bigint | `tests/tree/test_datatypes.test.js::TSDataType 枚举 INT64 用 bigint` | P1 |
| 10 | Node 原生｜树模型-数据类型：getDataTypeName 返回类型名 | `tests/tree/test_datatypes.test.js::TSDataType 枚举 getDataTypeName 返回类型名` | P1 |
| 11 | Node 原生｜树模型-写入：TreeTablet + addRow + insertTablet | `tests/tree/test_insert.test.js::树模型-数据写入 insertTablet 单表写入 TreeTablet + addRow + insertTablet` | P1 |
| 12 | Node 原生｜树模型-写入：plain object 方式 insertTablet | `tests/tree/test_insert.test.js::树模型-数据写入 insertTablet 单表写入 plain object 方式 insertTablet` | P1 |
| 13 | Node 原生｜树模型-写入：insertTablets 单次 RPC 调用 | `tests/tree/test_insert.test.js::树模型-数据写入 insertTablets 多设备批量 insertTablets 单次 RPC 调用` | P1 |
| 14 | Node 原生｜树模型-写入：insertTabletsParallel 指定并发度 | `tests/tree/test_insert.test.js::树模型-数据写入 insertTabletsParallel 并发写入 insertTabletsParallel 指定并发度` | P1 |
| 15 | Node 原生｜树模型-元数据：CREATE DATABASE + SHOW DATABASES 流程 | `tests/tree/test_metadata.test.js::树模型-数据库与元数据 CREATE DATABASE + SHOW DATABASES 流程` | P1 |
| 16 | Node 原生｜树模型-元数据：CREATE TIMESERIES 流程 | `tests/tree/test_metadata.test.js::树模型-数据库与元数据 CREATE TIMESERIES 流程` | P1 |
| 17 | Node 原生｜树模型-元数据：DELETE DATABASE 清理 | `tests/tree/test_metadata.test.js::树模型-数据库与元数据 DELETE DATABASE 清理` | P1 |
| 18 | Node 原生｜树模型-元数据：SHOW TIMESERIES 查询 | `tests/tree/test_metadata.test.js::树模型-数据库与元数据 SHOW TIMESERIES 查询` | P1 |
| 19 | Node 原生｜树模型-连接池：executeNonQueryStatement 方法存在 | `tests/tree/test_pool.test.js::SessionPool 连接池 方法验证 executeNonQueryStatement 方法存在` | P1 |
| 20 | Node 原生｜树模型-连接池：executeQueryStatement 方法存在 | `tests/tree/test_pool.test.js::SessionPool 连接池 方法验证 executeQueryStatement 方法存在` | P1 |
| 21 | Node 原生｜树模型-连接池：getSession / releaseSession 方法存在 | `tests/tree/test_pool.test.js::SessionPool 连接池 方法验证 getSession / releaseSession 方法存在` | P1 |
| 22 | Node 原生｜树模型-连接池：insertTablet 方法存在 | `tests/tree/test_pool.test.js::SessionPool 连接池 方法验证 insertTablet 方法存在` | P1 |
| 23 | Node 原生｜树模型-连接池：insertTabletsParallel 方法存在 | `tests/tree/test_pool.test.js::SessionPool 连接池 方法验证 insertTabletsParallel 方法存在` | P1 |
| 24 | Node 原生｜树模型-连接池：PoolConfigBuilder 方式 | `tests/tree/test_pool.test.js::SessionPool 连接池 构造 PoolConfigBuilder 方式` | P1 |
| 25 | Node 原生｜树模型-连接池：nodeUrls 多节点方式 | `tests/tree/test_pool.test.js::SessionPool 连接池 构造 nodeUrls 多节点方式` | P1 |
| 26 | Node 原生｜树模型-连接池：传统构造 new SessionPool(host,port,options) | `tests/tree/test_pool.test.js::SessionPool 连接池 构造 传统构造 new SessionPool(host,port,options)` | P1 |
| 27 | Node 原生｜树模型-查询结果：SessionDataSet 类型可导入 | `tests/tree/test_query.test.js::SessionDataSet 查询结果集 SessionDataSet 类型可导入` | P1 |
| 28 | Node 原生｜树模型-会话：指定 enableSSL | `tests/tree/test_session.test.js::Session 连接管理 ConfigBuilder 完整参数 指定 enableSSL` | P1 |
| 29 | Node 原生｜树模型-会话：指定 fetchSize | `tests/tree/test_session.test.js::Session 连接管理 ConfigBuilder 完整参数 指定 fetchSize` | P1 |
| 30 | Node 原生｜树模型-会话：指定 timezone | `tests/tree/test_session.test.js::Session 连接管理 ConfigBuilder 完整参数 指定 timezone` | P1 |
| 31 | Node 原生｜树模型-会话：ConfigBuilder 构建配置 | `tests/tree/test_session.test.js::Session 连接管理 构造与生命周期 ConfigBuilder 构建配置` | P1 |
| 32 | Node 原生｜树模型-会话：nodeUrls 空数组抛异常 | `tests/tree/test_session.test.js::Session 连接管理 构造与生命周期 nodeUrls 空数组抛异常` | P1 |
| 33 | Node 原生｜树模型-会话：最简参数构造 | `tests/tree/test_session.test.js::Session 连接管理 构造与生命周期 最简参数构造` | P1 |
| 34 | Node 原生｜树模型-会话：缺 host 和 nodeUrls 抛异常 | `tests/tree/test_session.test.js::Session 连接管理 构造与生命周期 缺 host 和 nodeUrls 抛异常` | P1 |
| 35 | Node 原生｜树模型-会话：new TreeTablet + addRow 方式 | `tests/tree/test_session.test.js::TreeTablet 构造（模仿 basic-session.ts 示例） new TreeTablet + addRow 方式` | P1 |
| 36 | Node 原生｜树模型-会话：plain object 方式（兼容旧 API） | `tests/tree/test_session.test.js::TreeTablet 构造（模仿 basic-session.ts 示例） plain object 方式（兼容旧 API）` | P1 |

## 三、待确认/说明

1. **测试覆盖口径**：本批 36 条均为**构造、枚举、方法存在性**测试，不实际连接/读写数据库；真正连接数据库的 `test_integration.test.js`（5 条）与 `test_runtime_supplement.test.js`（5 条）被 `jest.config.cjs` 排除（与 111 节点一致）。因此 K8s 实例的重定向不会触发，`session-nodejs` 继续按 K8s 实例方案执行。
2. **连接参数**：`tests/helpers/testEnv.js` 统一从 `IOTDB_HOST/IOTDB_PORT/IOTDB_USER/IOTDB_PASSWORD` 读取，默认 `127.0.0.1:6667`、`root/TimechoDB@2021`；111 独立运行可设置 `IOTDB_PASSWORD=root`。
3. **功能点归类**：按测试文件归入树模型（会话/写入/连接池/元数据/数据类型/查询结果）与表模型（Tablet 写入/会话）。
4. **用例执行**：`start.sh case <ID>` 使用 Jest `--testNamePattern` 精确匹配 `fullName`，产物为 JUnit XML（带 `case_id`）。

## 四、验证记录

- 76 执行机 Node 22.23.1：`npm ci` 成功；`sh start.sh prepare` 成功。
- 76 本地 TimechoDB（127.0.0.1:6667）：Jest 全量 **36 passed / 36 total**（约 2 秒）。
- K8s 实例 spike：由于 36 条不实际连接数据库，连接 `native-java-20261102` 仍通过；重定向未触发。
- PLM run 816（2026-11-05 19:26）：**SUCCESS，36/36 passed，0 failed/error/skipped**，约 74 秒；K8s 实例 `tdb-plm-dadae7af8e224e67997f9c93bb9bd871`、Native 模板 revision 1；导入编号 `TimechoDB-3363 ~ 3398`。
