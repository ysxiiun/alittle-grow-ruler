# Repository Guidelines

## 项目结构与模块组织
本仓库是一个前后端同仓项目。前端位于 `src/client`，按 `pages`、`components`、`hooks`、`utils` 分层；后端位于 `src/server`，按 `routes`、`database`、`templates`、`mcp` 划分；CLI 入口在 `src/cli/index.js`。运行时 SQLite 数据库存放于 `data/`，构建产物输出到 `dist/`。新增功能时，优先保持页面、路由、数据访问三层分离。

## 构建、测试与开发命令
- `npm install`：安装依赖。
- `npm run dev`：同时启动 Vite 前端和 `tsx watch` 后端。
- `npm run dev:client`：仅启动前端，默认通过 Vite 提供开发服务。
- `npm run dev:server`：仅启动后端，默认监听 `31000`。
- `npm run build`：构建前端与服务端到 `dist/`。
- `npm run preview`：运行生产构建后的 Node 服务。
- `npm run cli:status`：检查 CLI 管理的服务状态；相关命令还包括 `cli:start`、`cli:stop`、`cli:restart`。

## 编码风格与命名约定
项目使用 TypeScript，缩进为 2 个空格，语句末尾保留分号。React 组件、页面和 Hook 文件遵循现有模式：页面目录使用 PascalCase，例如 `src/client/pages/RulerDetail/`；工具函数文件使用小写或 camelCase，例如 `request.ts`；服务端路由按资源命名，例如 `routes/records.ts`。优先使用函数组件、显式类型和短注释，保持中文文案统一。

## 测试指南
当前 `package.json` 未配置自动化测试脚本。提交前至少执行 `npm run build`，确认前后端 TypeScript 编译通过，并手动验证关键流程：创建记录尺、录入数据、导入 CSV、查看分析图表。若新增测试，建议将前端测试放在对应模块旁，命名为 `*.test.ts(x)`，并在新增脚本后更新本文档。

## 提交与 Pull Request 规范
现有 Git 历史采用 Conventional Commits，例如 `feat: ALittle 成长尺完整应用实现`。后续提交建议继续使用 `feat:`、`fix:`、`refactor:`、`docs:` 前缀，并保持单次提交只解决一个主题。提交 PR 时应包含变更摘要、影响范围、验证步骤；如果涉及 UI，请附页面截图；如果涉及数据结构或接口，请说明兼容性和迁移影响。

## 配置与数据提示
开发环境常用端口为前端 `30000`、后端 `31000`，生产默认端口为 `24010`。不要提交 `data/` 下的运行时数据库变更，也不要把本地导入样例误当作测试基线提交。
