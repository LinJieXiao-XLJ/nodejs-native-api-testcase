# Node.js 原生接口测试工具

本仓库用于验证 TimechoDB/IoTDB Node.js 原生客户端，覆盖 Thrift RPC、树模型、表模型、连接池、批量写入和查询结果集等能力。

## 技术方案

测试直接使用 `lib/@iotdb/client/` 下的 Node.js 客户端构建产物：

- `client/`：`Session`、`TableSession`、`SessionPool`、`TableSessionPool`、Tablet 与结果集封装。
- `connection/`：Thrift 连接和会话管理。
- `thrift/generated/`：由 IoTDB Thrift 定义生成的 RPC 客户端与类型。
- `utils/`：配置、数据类型、序列化、日志和资源清理等公共能力。

## 项目结构

```text
nodejs-native-api-testcase/
├── conf/config.json                    # 本地测试配置示例
├── lib/@iotdb/client/                  # 被测 Node.js 客户端构建产物
├── tests/
│   ├── tree/                           # 树模型、连接池和真实环境测试
│   └── table/                          # 表模型测试
├── .c8rc.json                          # 覆盖率配置
├── jest.config.cjs                     # 默认离线测试配置
├── jest.integration.config.cjs         # 真实 IoTDB 测试配置
├── package.json
└── README.md
```

## 环境

- Node.js >= 16.0.0
- npm
- 运行集成测试时，需要可访问的 IoTDB/TimechoDB 服务

## 安装

```bash
npm install
```

## 执行测试

默认命令只执行不依赖数据库服务的离线测试：

```bash
npm test
npm run test:tree
npm run test:table
```

真实环境测试默认连接 `127.0.0.1:6667`，默认测试账号为 `root/root`。其中补充运行时测试也支持通过环境变量覆盖连接信息：

```bash
IOTDB_HOST=127.0.0.1 \
IOTDB_PORT=6667 \
IOTDB_USER=root \
IOTDB_PASSWORD=root \
npm run test:integration
```

Windows PowerShell 示例：

```powershell
$env:IOTDB_HOST = '127.0.0.1'
$env:IOTDB_PORT = '6667'
$env:IOTDB_USER = 'root'
$env:IOTDB_PASSWORD = 'root'
npm.cmd run test:integration
```

集成测试会创建并清理 `root.test_nodejs` 和 `root.v2_977_supplement`，请勿指向生产环境。

## 覆盖率

```bash
npm run coverage
```

HTML 报告生成在 `coverage/`，该目录不会提交到 Git。

## 参考文档

- [Timecho IoTDB Node.js 原生接口编程指南](https://timecho.com/docs/zh/UserGuide/latest/API/Programming-NodeJS-Native-API.html)
