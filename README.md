# ALittle 成长尺（ALittle Grow Ruler）

一款简约好用的成长记录软件，支持多种成长记录模板、数据导入以及趋势可视化分析。

## ✨ 特性

- 📱 **移动端优先** - 专为移动端优化的界面设计，支持触摸操作
- 📊 **数据可视化** - ECharts 图表展示多字段趋势
- 📈 **智能分析** - 模板驱动的统计卡片、周均变化与趋势分析
- 📥 **数据导入** - 支持 Excel/CSV 格式一键导入
- 🧩 **模板化记录** - 支持身高体重、孕期体重、血压等模板
- 🕒 **双时间模型** - 孕期体重支持“数据日期”和“记录时间”分离
- 🎨 **美观界面** - 基于 Ant Design 与 Ant Design Mobile 的现代化 UI

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器（前端 + 后端）
npm run dev
```

访问 http://localhost:30000 开始使用

### 生产环境

```bash
# 构建
npm run build

# 全局安装 CLI
npm link

# 使用 CLI 命令
grow-ruler start    # 启动服务
grow-ruler stop     # 停止服务
grow-ruler restart  # 重启服务
grow-ruler status   # 查看状态
grow-ruler help     # 帮助信息
```

生产环境默认端口：**24010**

## 📖 功能说明

### 记录尺（Record Ruler）

记录尺是一套完整的成长记录，包含：
- **名称** - 记录尺的标题
- **描述** - 可选的详细描述
- **模板类型** - 当前支持多种内置模板

当前内置模板：
- **身高体重** - 记录身高、体重并展示双线趋势
- **孕期体重** - 记录晨起/睡前体重并分析日均与周均增长
- **血压记录** - 记录收缩压、舒张压与脉搏

### 身高体重模板

记录数据：
- **身高** - 单位：厘米 (cm)
- **体重** - 单位：公斤 (kg) / 斤（支持切换）

数据分析：
- **数据趋势图** - 按日期展示身高体重变化趋势
- **月均同比** - 本月平均值与去年同月对比
- **月环比** - 本月平均值与上月对比
- **周环比** - 本周平均值与上周对比

### 孕期体重模板

记录数据：
- **体重** - 单位：斤
- **体重类型** - 晨起 / 睡前
- **数据日期** - 用于统计归属的业务日期
- **记录时间** - 实际录入时间，精确到秒

时间规则：
- 当记录时间处于 `00:00-03:00` 且体重类型为“睡前”时，数据日期默认回退到前一天
- 用户可以手动调整数据日期；一旦手动调整，保存时以用户输入为准
- 趋势图、统计卡片、周均变化等分析统一按数据日期聚合
- 记录列表同时展示“数据日期”和“记录时间”，便于区分统计归属与真实录入时刻

## 📁 项目结构

```
alittle-grow-ruler/
├── src/
│   ├── client/              # 前端代码
│   │   ├── components/      # 通用组件
│   │   ├── hooks/           # 客户端 Hooks
│   │   ├── pages/           # 页面组件
│   │   │   ├── Home/        # 首页（记录尺列表）
│   │   │   ├── RulerForm/   # 创建/编辑记录尺
│   │   │   ├── RulerDetail/ # 记录尺详情
│   │   │   ├── DataForm/    # 添加/编辑数据
│   │   │   ├── ImportData/  # 数据导入
│   │   │   ├── Templates/   # 模板列表
│   │   │   └── TemplateDetail/ # 模板详情
│   │   ├── utils/           # 工具函数
│   │   └── App.tsx          # 主应用
│   ├── server/              # 后端代码
│   │   ├── database/        # 数据库操作
│   │   │   ├── index.ts     # 数据库连接
│   │   │   ├── records.ts   # 记录尺 DAO
│   │   │   ├── dataEntries.ts # 记录数据 DAO
│   │   │   ├── templates.ts # 模板 DAO
│   │   │   └── analysis.ts  # 数据分析服务
│   │   ├── routes/          # API 路由
│   │   │   ├── rulers.ts    # 记录尺 API
│   │   │   ├── records.ts   # 记录数据 API
│   │   │   ├── templates.ts # 模板 API
│   │   │   └── analysis.ts  # 数据分析 API
│   │   ├── templates/       # 内置模板与导入导出配置
│   │   └── mcp/             # MCP 服务接口
│   │   └── index.ts         # 服务器入口
│   └── cli/                 # CLI 命令
│       └── index.ts         # grow-ruler 命令
├── data/                    # SQLite 数据库文件（运行时创建）
├── dist/                    # 构建输出
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔧 技术栈

| 层次 | 技术 |
|------|------|
| 语言 | TypeScript |
| 前端 | React 18 + Ant Design + Ant Design Mobile |
| 图表 | ECharts + echarts-for-react |
| 构建 | Vite |
| 后端 | Express |
| 数据库 | SQLite (better-sqlite3) |

## 📱 API 文档

### 记录尺 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/rulers` | 获取所有记录尺（支持 `?search=`, `?template_id=`） |
| GET | `/api/rulers/:id` | 获取单个记录尺详情（含模板和最近数据） |
| POST | `/api/rulers` | 创建记录尺 |
| PUT | `/api/rulers/:id` | 更新记录尺 |
| DELETE | `/api/rulers/:id` | 删除记录尺 |

### 记录数据 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/records?record_id=&page=&pageSize=` | 获取记录列表（分页） |
| GET | `/api/records/:id` | 获取单条记录 |
| POST | `/api/records` | 创建记录，支持 `timestamp`、`data_date`、`values`、`note` |
| PUT | `/api/records/:id` | 更新记录，支持 `data_date` 与动态字段 |
| DELETE | `/api/records/:id` | 删除记录 |
| POST | `/api/records/import` | 导入 Excel/CSV |
| GET | `/api/records/import/template` | 下载导入模板 |

### 模板 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/templates` | 获取模板列表 |
| GET | `/api/templates/:id` | 获取模板详情 |

### 数据分析 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/analysis/stats/:recordId` | 获取字段统计值 |
| GET | `/api/analysis/chart/:recordId` | 获取模板图表数据 |
| GET | `/api/analysis/trend/:recordId` | 获取数据趋势 |
| GET | `/api/analysis/monthly-compare/:recordId` | 获取月均同比 |
| GET | `/api/analysis/period-compare/:recordId` | 获取周/月环比 |
| GET | `/api/analysis/full/:recordId` | 获取完整分析数据 |

## 📝 开发说明

### 端口配置

- 开发环境：前端 `30000`，后端 `31000`
- 生产环境：统一 `24010`

Vite 开发服务器配置了代理，`/api` 请求自动转发到后端

### 数据库

使用 SQLite 数据库，文件位于 `data/grow-ruler.db`（首次运行时自动创建）

当前核心表结构：
- `templates` - 模板定义
- `records` - 记录尺表
- `data_entries` - 记录数据表

其中 `data_entries` 关键字段包括：
- `timestamp` - 真实记录时间
- `data_date` - 统计归属日期
- `values` - 模板动态字段 JSON 数据
- `note` - 备注

### 移动端适配

- 使用 `antd-mobile` 组件库
- 视口设置为不可缩放：`user-scalable=no`
- 触摸友好的交互设计

## 📄 License

MIT
