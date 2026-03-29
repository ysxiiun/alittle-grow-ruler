# ALittle 成长尺（ALittle Grow Ruler）

一款简约好用的成长记录软件，支持身高、体重数据的跟踪与可视化分析。

## ✨ 特性

- 📱 **移动端优先** - 专为移动端优化的界面设计，支持触摸操作
- 📊 **数据可视化** - ECharts 图表展示数据趋势
- 📈 **智能分析** - 月均同比、周/月环比分析
- 📥 **数据导入** - 支持 Excel/CSV 格式一键导入
- 🎨 **美观界面** - 基于 Ant Design Mobile 的现代化 UI

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
- **模板类型** - 当前支持"身高体重"模板

### 身高体重模板

记录数据：
- **身高** - 单位：厘米 (cm)
- **体重** - 单位：公斤 (kg) / 斤（支持切换）

数据分析：
- **数据趋势图** - 按日期展示身高体重变化趋势
- **月均同比** - 本月平均值与去年同月对比
- **月环比** - 本月平均值与上月对比
- **周环比** - 本周平均值与上周对比

## 📁 项目结构

```
alittle-grow-ruler/
├── src/
│   ├── client/              # 前端代码
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   │   ├── Home/        # 首页（记录尺列表）
│   │   │   ├── RulerForm/   # 创建/编辑记录尺
│   │   │   ├── RulerDetail/ # 记录尺详情
│   │   │   └── ImportData/  # 数据导入
│   │   ├── utils/           # 工具函数
│   │   └── App.tsx          # 主应用
│   ├── server/              # 后端代码
│   │   ├── database/        # 数据库操作
│   │   │   ├── index.ts     # 数据库连接
│   │   │   ├── rulers.ts    # 记录尺 DAO
│   │   │   ├── records.ts   # 记录数据 DAO
│   │   │   └── analysis.ts  # 数据分析服务
│   │   ├── routes/          # API 路由
│   │   │   ├── rulers.ts    # 记录尺 API
│   │   │   ├── records.ts   # 记录数据 API
│   │   │   └── analysis.ts  # 数据分析 API
│   │   └── index.ts         # 服务器入口
│   └── cli/                 # CLI 命令
│       └── index.js         # grow-ruler 命令
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
| 前端 | React 18 + Ant Design Mobile |
| 图表 | ECharts + echarts-for-react |
| 构建 | Vite |
| 后端 | Express |
| 数据库 | SQLite (better-sqlite3) |

## 📱 API 文档

### 记录尺 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/rulers` | 获取所有记录尺（支持 `?search=`, `?template_type=`） |
| GET | `/api/rulers/:id` | 获取单个记录尺 |
| POST | `/api/rulers` | 创建记录尺 |
| PUT | `/api/rulers/:id` | 更新记录尺 |
| DELETE | `/api/rulers/:id` | 删除记录尺 |

### 记录数据 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/records?ruler_id=&page=&pageSize=` | 获取记录列表（分页） |
| GET | `/api/records/:id` | 获取单条记录 |
| POST | `/api/records` | 创建记录 |
| PUT | `/api/records/:id` | 更新记录 |
| DELETE | `/api/records/:id` | 删除记录 |
| POST | `/api/records/import` | 导入 Excel/CSV |
| GET | `/api/records/import/template` | 下载导入模板 |

### 数据分析 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/analysis/trend/:rulerId` | 获取数据趋势 |
| GET | `/api/analysis/monthly-compare/:rulerId` | 获取月均同比 |
| GET | `/api/analysis/period-compare/:rulerId` | 获取周/月环比 |
| GET | `/api/analysis/full/:rulerId` | 获取完整分析数据 |

## 📝 开发说明

### 端口配置

- 开发环境：前端 `30000`，后端 `31000`
- 生产环境：统一 `24010`

Vite 开发服务器配置了代理，`/api` 请求自动转发到后端

### 数据库

使用 SQLite 数据库，文件位于 `data/grow-ruler.db`（首次运行时自动创建）

包含两张表：
- `record_rulers` - 记录尺表
- `records` - 记录数据表

### 移动端适配

- 使用 `antd-mobile` 组件库
- 视口设置为不可缩放：`user-scalable=no`
- 触摸友好的交互设计

## 📄 License

MIT
