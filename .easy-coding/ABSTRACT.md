# 项目架构摘要

> 最后更新：2026-04-12

## 项目定位

ALittle 成长尺是一个前后端同仓的成长数据记录应用，用于创建记录尺、录入日常数据、导入 CSV 并查看统计与趋势图表。

## 模块结构

| 模块 | 职责 | 路径 |
|---|---|---|
| 客户端入口 | 注入主题、路由和全局配置 | `src/client/App.tsx` |
| 页面层 | 记录尺列表、详情、表单、导入、模板展示 | `src/client/pages/` |
| 客户端工具层 | 请求封装与设备判断 | `src/client/utils/` `src/client/hooks/` |
| 服务端入口 | 启动 Express、注册 API、初始化数据库与模板 | `src/server/index.ts` |
| 路由层 | 对外提供 rulers、records、analysis、templates API | `src/server/routes/` |
| 数据访问层 | SQLite 读写、统计分析、记录管理 | `src/server/database/` |
| 模板系统 | 内置模板、模板迁移、导入导出配置 | `src/server/templates/` |
| CLI | 管理服务启停与状态 | `src/cli/index.ts` |

## 核心业务流程

1. **记录尺管理**：前端创建或编辑记录尺，服务端通过 `rulers` 路由写入 SQLite。
2. **数据录入与导入**：前端表单或 CSV 导入数据，服务端通过 `records` 路由落库并校验字段。
3. **趋势分析展示**：详情页根据模板请求 `analysis` 接口，渲染统计卡片、趋势图和记录表。
4. **模板驱动渲染**：服务端根据模板定义字段、统计项和图表配置，前端动态展示不同业务类型。

## 技术栈

- TypeScript
- React 18
- Vite
- Ant Design / Ant Design Mobile
- Express
- better-sqlite3
- ECharts
- Day.js

## 目录索引

| 功能 | 路径 |
|---|---|
| 记录尺详情页与趋势图 | `src/client/pages/RulerDetail/index.tsx` |
| 记录尺新增编辑 | `src/client/pages/RulerForm/index.tsx` |
| 数据录入页 | `src/client/pages/DataForm/index.tsx` |
| 导入数据页 | `src/client/pages/ImportData/index.tsx` |
| 分析接口 | `src/server/routes/analysis.ts` |
| 分析计算逻辑 | `src/server/database/analysis.ts` |
| 记录数据访问 | `src/server/database/records.ts` |
| 内置模板定义 | `src/server/templates/builtin/` |
