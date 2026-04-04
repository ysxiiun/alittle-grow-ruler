# 成长记录 - 产品设计文档

**版本：** v1.0  
**日期：** 2026-03-31  
**状态：** 设计稿  
**作者：** 豆点 🫘

---

## 目录

1. [产品概述](#一产品概述)
2. [功能架构](#二功能架构)
3. [详细页面设计](#三详细页面设计)
4. [数据库设计](#四数据库设计)
5. [API 设计](#五 api 设计)
6. [内置模板设计](#六内置模板设计)
7. [视觉设计规范](#七视觉设计规范)
8. [交互设计规范](#八交互设计规范)
9. [响应式断点](#九响应式断点)
10. [技术实现要点](#十技术实现要点)
11. [待确认事项](#十一待确认事项)
12. [版本规划](#十二版本规划)
13. [MCP 服务设计](#十三 mcp 服务设计)

---

## 一、产品概述

### 1.1 产品定位

通用型成长数据记录与分析工具，通过模板插件扩展能力，支持 PC 端和移动端访问。

### 1.2 目标用户

- 需要记录个人成长数据的普通用户
- 需要追踪健康指标的群体
- 需要记录特定项目数据的用户

### 1.3 核心价值

- 简单易用，快速记录
- 模板化，降低配置成本
- 自动分析，直观展示趋势
- 多端适配，随时随地访问

### 1.4 使用场景

| 场景 | 描述 | 示例 |
|:---:|:---:|:---:|
| 孕期管理 | 记录孕期体重变化 | 孕妇记录每日体重 |
| 儿童成长 | 记录身高体重发育 | 家长记录宝宝成长 |
| 健康监测 | 记录血压血糖等指标 | 慢性病患者日常监测 |
| 健身追踪 | 记录体重体脂变化 | 健身爱好者追踪进度 |
| 其他场景 | 任何可量化的成长数据 | 植物生长、学习进度等 |

---

## 二、功能架构

### 2.1 功能模块图

```
┌─────────────────────────────────────────────────┐
│                    成长记录                      │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 模板管理  │  │ 记录集管理│  │ 数据记录  │      │
│  ├──────────┤  ├──────────┤  ├──────────┤      │
│  │ 模板列表  │  │ 创建记录集│  │ 添加数据  │      │
│  │ 模板详情  │  │ 记录集列表│  │ 编辑数据  │      │
│  │ 模板安装  │  │ 记录集详情│  │ 删除数据  │      │
│  │ 模板卸载  │  │ 删除记录集│  │ 数据列表  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 数据分析  │  │ 系统设置  │  │ 数据管理  │      │
│  ├──────────┤  ├──────────┤  ├──────────┤      │
│  │ 趋势图表  │  │ 主题切换  │  │ 数据导出  │      │
│  │ 统计分析  │  │ 数据备份  │  │ 数据导入  │      │
│  │ 环比分析  │  │ 数据清理  │  │ 数据恢复  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           MCP 服务 (AI Agent 接口)         │   │
│  ├──────────────────────────────────────────┤   │
│  │ create_record | add_data | get_data      │   │
│  │ get_stats | get_chart_data | ...         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 2.2 功能清单

| 模块 | 功能 | 优先级 | 说明 |
|:---:|:---:|:---:|:---:|
| 模板管理 | 查看模板列表 | P0 | 展示所有可用模板 |
| 模板管理 | 查看模板详情 | P0 | 展示模板字段和图表配置 |
| 记录集管理 | 创建记录集 | P0 | 选择模板 + 填写信息 |
| 记录集管理 | 记录集列表 | P0 | 展示所有记录集 |
| 记录集管理 | 记录集详情 | P0 | 展示数据 + 图表 |
| 记录集管理 | 删除记录集 | P0 | 软删除 |
| 数据记录 | 添加数据 | P0 | 根据模板字段录入 |
| 数据记录 | 编辑数据 | P0 | 修改已有数据 |
| 数据记录 | 删除数据 | P0 | 单条删除 |
| 数据记录 | 数据列表 | P0 | 时间线展示 |
| 数据分析 | 趋势图表 | P0 | 折线图 |
| 数据分析 | 统计分析 | P0 | 最大值、最小值、平均值 |
| 数据分析 | 环比分析 | P1 | 周/月环比 |
| 数据管理 | 数据导出 | P1 | 导出为 CSV/JSON |
| 数据管理 | 数据导入 | P1 | 从 CSV/JSON 导入 |
| 数据管理 | 数据备份 | P2 | 备份到文件 |
| 系统设置 | 主题切换 | P2 | 清新/深色 |
| 系统设置 | 数据清理 | P2 | 清理过期数据 |
| MCP 服务 | create_record | P0 | 创建记录集 |
| MCP 服务 | add_data | P0 | 添加数据 |
| MCP 服务 | get_data | P0 | 获取数据 |
| MCP 服务 | get_stats | P0 | 统计分析 |
| MCP 服务 | get_chart_data | P1 | 图表数据 |
| MCP 服务 | update_data | P1 | 更新数据 |
| MCP 服务 | delete_data | P1 | 删除数据 |
| MCP 服务 | list_records | P1 | 记录集列表 |
| MCP 服务 | get_record | P1 | 记录集详情 |
| MCP 服务 | delete_record | P2 | 删除记录集 |

---

## 三、详细页面设计

### 3.1 页面列表

| 页面 | 路由 | 端 | 说明 |
|:---:|:---:|:---:|:---:|
| 首页 | `/` | PC+Mobile | 记录集列表 |
| 模板页 | `/templates` | PC+Mobile | 模板列表 |
| 模板详情 | `/templates/:id` | PC+Mobile | 模板详情 |
| 创建记录集 | `/records/new` | PC+Mobile | 创建表单 |
| 记录集详情 | `/records/:id` | PC+Mobile | 数据 + 图表 |
| 添加数据 | `/records/:id/add` | PC+Mobile | 数据录入 |
| 编辑数据 | `/records/:id/edit/:dataId` | PC+Mobile | 数据编辑 |
| 设置页 | `/settings` | PC+Mobile | 系统设置 |

---

### 3.2 首页（记录集列表）

#### 移动端

```
┌─────────────────────────────┐
│ ☰          成长记录    ⚙️   │  顶部导航
├─────────────────────────────┤
│                             │
│  [+ 新建记录集]              │  主要操作
│                             │
├─────────────────────────────┤
│ 📊 模板库                    │  快捷入口
├─────────────────────────────┤
│                             │
│  我的记录集                  │
│  ┌─────────────────────┐   │
│  │ 🤰 孕期体重记录      │   │
│  │    最后：120 斤       │   │  记录集卡片
│  │    今天 08:00       │   │
│  │    已记录 15 次      │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 📏 宝宝身高记录      │   │
│  │    最后：75cm       │   │
│  │    3 天前           │   │
│  │    已记录 24 次      │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ ❤️ 血压监测         │   │
│  │    最后：120/80     │   │
│  │    昨天 19:00       │   │
│  │    已记录 60 次      │   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│  🏠      📊      👤        │  底部导航
│ 首页    模板    我的        │
└─────────────────────────────┘
```

#### PC 端

```
┌─────────────────────────────────────────────────────────┐
│  成长记录                                                │  Logo
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│ 导航   │  我的记录集                     [+ 新建]       │
│        │                                                │
│ 🏠 首页 │  ┌─────────────┐ ┌─────────────┐            │
│        │  │ 🤰 孕期体重  │ │ 📏 宝宝身高 │            │
│ 📊 模板 │  │   120 斤     │ │   75cm      │            │
│        │  │   今天       │ │   3 天前     │            │
│ 👤 我的 │  │   15 次      │ │   24 次      │            │
│        │  └─────────────┘ └─────────────┘            │
│ ⚙️ 设置 │                                                │
│        │  ┌─────────────┐ ┌─────────────┐            │
│        │  │ ❤️ 血压监测 │ │ ➕ 新建     │            │
│        │  │   120/80    │ │   创建新    │            │
│        │  │   昨天      │ │   记录集    │            │
│        │  │   60 次      │ │             │            │
│        │  └─────────────┘ └─────────────┘            │
│        │                                                │
└────────┴────────────────────────────────────────────────┘
```

---

### 3.3 记录集详情页

#### 移动端

```
┌─────────────────────────────┐
│ ←        孕期体重      ⋮    │  返回 + 更多
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐ │
│  │     120.5 斤          │ │  当前值卡片
│  │     今天 09:00        │ │
│  │     ↑ +0.5 斤         │ │
│  └───────────────────────┘ │
│                             │
├─────────────────────────────┤
│  📈 趋势分析                │
│                             │
│  ┌───────────────────────┐ │
│  │                       │ │
│  │   ~~~~~~~~↗           │ │  折线图
│  │  /                    │ │
│  │ /                     │ │
│  └───────────────────────┘ │
│                             │
│  统计信息                   │
│  ┌─────┬─────┬─────┬─────┐│
│  │最高 │最低 │平均 │增长 ││  统计卡片
│  │125  │110  │118  │+10  ││
│  └─────┴─────┴─────┴─────┘│
│                             │
├─────────────────────────────┤
│  📋 数据记录                │
│  ┌───────────────────────┐ │
│  │ 3/31  09:00  120.5 斤 │ │
│  │ 3/30  08:00  120.0 斤 │ │  数据列表
│  │ 3/29  08:30  119.5 斤 │ │
│  │ 3/28  07:50  119.0 斤 │ │
│  └───────────────────────┘ │
│        ↓ 加载更多 ↓        │
├─────────────────────────────┤
│        [+ 添加记录]         │  悬浮按钮
└─────────────────────────────┘
```

#### PC 端

```
┌─────────────────────────────────────────────────────────┐
│  ← 孕期体重记录                              [导出] [⋮] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────┐  ┌─────────────────────────────┐  │
│  │  当前值        │  │                             │  │
│  │  120.5 斤      │  │                             │  │
│  │  ↑ +0.5 斤     │  │      趋势折线图              │  │
│  │  今天 09:00    │  │      (更大，可交互)          │  │
│  └────────────────┘  │                             │  │
│                      │                             │  │
│  ┌─────┬─────┬─────┐│                             │  │
│  │最高 │最低 │平均 ││                             │  │
│  │125  │110  │118  ││                             │  │
│  └─────┴─────┴─────┘│                             │  │
│                      └─────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📋 数据记录                          [+ 添加记录]     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 日期      │ 时间   │ 体重 (斤) │ 备注    │ 操作 │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ 2026-03-31│ 09:00 │ 120.5    │ 早餐后  │ ✏️ 🗑️│  │
│  │ 2026-03-30│ 08:00 │ 120.0    │ 空腹   │ ✏️ 🗑️│  │
│  │ 2026-03-29│ 08:30 │ 119.5    │ 早餐后  │ ✏️ 🗑️│  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│         1  2  3  4  5  ...  10        [前往]           │
└─────────────────────────────────────────────────────────┘
```

---

### 3.4 添加数据页

#### 移动端

```
┌─────────────────────────────┐
│ ←        添加记录           │
├─────────────────────────────┤
│                             │
│  日期                       │
│  ┌───────────────────────┐ │
│  │ 2026 年 3 月 31 日       │ │
│  └───────────────────────┘ │
│                             │
│  时间                       │
│  ┌───────────────────────┐ │
│  │ 09:00                │ │
│  └───────────────────────┘ │
│                             │
│  体重 (斤) *                │
│  ┌───────────────────────┐ │
│  │ 120.5                │ │
│  └───────────────────────┘ │
│                             │
│  备注                       │
│  ┌───────────────────────┐ │
│  │ 早餐后测量            │ │
│  └───────────────────────┘ │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│      [取消]   [保存]        │
└─────────────────────────────┘
```

---

### 3.5 模板详情页

#### 移动端

```
┌─────────────────────────────┐
│ ←      孕期体重记录    [使用]│
├─────────────────────────────┤
│                             │
│  🤰 孕期体重记录             │
│                             │
│  记录孕期体重变化，分析增长  │
│  趋势，帮助科学管理孕期健康。│
│                             │
├─────────────────────────────┤
│  📋 记录字段                 │
│  ┌───────────────────────┐ │
│  │ 体重                  │ │
│  │ 类型：数字            │ │
│  │ 单位：斤              │ │
│  │ 精度：1 位小数         │ │
│  └───────────────────────┘ │
│                             │
├─────────────────────────────┤
│  📊 分析图表                 │
│  • 体重趋势折线图           │
│  • 周均环比柱状图           │
│  • 增长趋势线               │
│                             │
├─────────────────────────────┤
│  📏 统计指标                 │
│  • 总增长量                 │
│  • 周均增长                 │
│  • 最大/最小值              │
│  • 平均值                   │
│                             │
└─────────────────────────────┘
```

---

## 四、数据库设计

### 4.1 表结构

#### templates（模板表）

| 字段 | 类型 | 说明 | 示例 |
|:---:|:---:|:---:|:---:|
| id | TEXT | 模板 ID | pregnancy-weight |
| name | TEXT | 模板名称 | 孕期体重记录 |
| description | TEXT | 模板说明 | 记录孕期体重... |
| icon | TEXT | 图标 emoji | 🤰 |
| fields | TEXT | 字段定义 JSON | 见下方 |
| charts | TEXT | 图表配置 JSON | 见下方 |
| stats | TEXT | 统计配置 JSON | 见下方 |
| is_builtin | INTEGER | 是否内置 | 1 |
| created_at | DATETIME | 创建时间 | 2026-03-31 00:00:00 |

#### records（记录集表）

| 字段 | 类型 | 说明 | 示例 |
|:---:|:---:|:---:|:---:|
| id | INTEGER | 记录集 ID | 1 |
| template_id | TEXT | 模板 ID | pregnancy-weight |
| name | TEXT | 记录集名称 | 我的孕期体重 |
| description | TEXT | 备注说明 | 第一胎记录 |
| subject | TEXT | 记录对象 | 张三 |
| color | TEXT | 主题色 | #F59E0B |
| is_deleted | INTEGER | 软删除标记 | 0 |
| created_at | DATETIME | 创建时间 | 2026-03-31 00:00:00 |
| updated_at | DATETIME | 更新时间 | 2026-03-31 00:00:00 |

#### data_entries（数据记录表）

| 字段 | 类型 | 说明 | 示例 |
|:---:|:---:|:---:|:---:|
| id | INTEGER | 记录 ID | 1 |
| record_id | INTEGER | 记录集 ID | 1 |
| timestamp | DATETIME | 记录时间 | 2026-03-31 09:00:00 |
| values | TEXT | 数据值 JSON | {"weight": 120.5} |
| note | TEXT | 备注 | 早餐后测量 |
| created_at | DATETIME | 创建时间 | 2026-03-31 09:00:00 |

---

### 4.2 JSON 结构示例

#### fields 示例

```json
[
  {
    "key": "weight",
    "label": "体重",
    "type": "number",
    "unit": "斤",
    "precision": 1,
    "required": true,
    "placeholder": "请输入体重"
  }
]
```

#### charts 示例

```json
[
  {
    "id": "trend",
    "type": "line",
    "title": "体重趋势",
    "field": "weight",
    "xAxis": "timestamp",
    "yAxis": "value"
  },
  {
    "id": "weekly-change",
    "type": "bar",
    "title": "周均环比",
    "field": "weight",
    "aggregate": "weekly",
    "calc": "change"
  }
]
```

#### stats 示例

```json
[
  {
    "id": "total-change",
    "label": "总增长",
    "calc": "last - first",
    "unit": "斤",
    "precision": 1
  },
  {
    "id": "avg-weekly",
    "label": "周均增长",
    "calc": "weekly_avg_change",
    "unit": "斤/周",
    "precision": 2
  },
  {
    "id": "max",
    "label": "最高值",
    "calc": "max",
    "unit": "斤",
    "precision": 1
  },
  {
    "id": "min",
    "label": "最低值",
    "calc": "min",
    "unit": "斤",
    "precision": 1
  }
]
```

---

## 五、API 设计

### 5.1 模板相关

```http
GET /api/templates
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "pregnancy-weight",
      "name": "孕期体重记录",
      "icon": "🤰",
      "description": "记录孕期体重变化..."
    }
  ]
}
```

```http
GET /api/templates/:id
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "pregnancy-weight",
    "name": "孕期体重记录",
    "fields": [...],
    "charts": [...],
    "stats": [...]
  }
}
```

---

### 5.2 记录集相关

```http
POST /api/records
```

**请求：**
```json
{
  "template_id": "pregnancy-weight",
  "name": "我的孕期体重",
  "subject": "张三",
  "description": "第一胎记录"
}
```

**响应：**
```json
{
  "success": true,
  "data": { "id": 1 }
}
```

```http
GET /api/records
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "我的孕期体重",
      "template_id": "pregnancy-weight",
      "subject": "张三",
      "last_value": "120.5 斤",
      "last_time": "2026-03-31 09:00",
      "count": 15
    }
  ]
}
```

```http
GET /api/records/:id
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "我的孕期体重",
    "template_id": "pregnancy-weight",
    "subject": "张三",
    "stats": { ... },
    "charts": { ... }
  }
}
```

```http
DELETE /api/records/:id
```

**响应：**
```json
{
  "success": true
}
```

---

### 5.3 数据记录相关

```http
GET /api/records/:id/data
```

**请求：** `?page=1&limit=20&start_date=xxx&end_date=xxx`

**响应：**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "timestamp": "2026-03-31 09:00:00",
        "values": { "weight": 120.5 },
        "note": "早餐后"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

```http
POST /api/records/:id/data
```

**请求：**
```json
{
  "timestamp": "2026-03-31 09:00:00",
  "values": { "weight": 120.5 },
  "note": "早餐后"
}
```

**响应：**
```json
{
  "success": true,
  "data": { "id": 1 }
}
```

```http
PUT /api/data/:id
```

**请求：**
```json
{
  "timestamp": "2026-03-31 09:00:00",
  "values": { "weight": 120.0 },
  "note": "空腹"
}
```

**响应：**
```json
{
  "success": true
}
```

```http
DELETE /api/data/:id
```

**响应：**
```json
{
  "success": true
}
```

---

### 5.4 统计分析相关

```http
GET /api/records/:id/stats
```

**请求：** `?field=weight&period=weekly`

**响应：**
```json
{
  "success": true,
  "data": {
    "total_change": 10.5,
    "weekly_avg": 0.8,
    "max": 125.0,
    "min": 110.0,
    "avg": 118.5,
    "count": 15
  }
}
```

```http
GET /api/records/:id/chart-data
```

**请求：** `?chart_id=trend&field=weight`

**响应：**
```json
{
  "success": true,
  "data": {
    "chart_id": "trend",
    "title": "体重趋势",
    "data": [
      { "timestamp": "2026-03-01", "value": 110.0 },
      { "timestamp": "2026-03-02", "value": 110.5 }
    ]
  }
}
```

---

### 5.5 数据管理相关

```http
GET /api/records/:id/export
```

**请求：** `?format=csv`

**响应：** 文件下载

```http
POST /api/records/:id/import
```

**请求：** `multipart/form-data (file)`

**响应：**
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "skipped": 2,
    "errors": []
  }
}
```

```http
POST /api/backup
```

**响应：** 文件下载

```http
POST /api/restore
```

**请求：** `multipart/form-data (file)`

**响应：**
```json
{
  "success": true,
  "data": {
    "restored": true
  }
}
```

---

### 5.6 MCP 专用 API

```http
POST /api/mcp/tools/list
```

**响应：**
```json
{
  "tools": [
    { "name": "create_record", "description": "..." },
    { "name": "add_data", "description": "..." },
    ...
  ]
}
```

```http
POST /api/mcp/tools/call
```

**请求：**
```json
{
  "name": "add_data",
  "arguments": {
    "record_id": 1,
    "values": { "weight": 120.5 }
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": { "id": 1 }
}
```

---

## 六、内置模板设计

### 6.1 孕期体重记录模板

```json
{
  "id": "pregnancy-weight",
  "name": "孕期体重记录",
  "icon": "🤰",
  "description": "记录孕期体重变化，分析增长趋势，帮助科学管理孕期健康",
  "fields": [
    {
      "key": "weight",
      "label": "体重",
      "type": "number",
      "unit": "斤",
      "precision": 1,
      "required": true,
      "placeholder": "请输入体重"
    }
  ],
  "charts": [
    {
      "id": "trend",
      "type": "line",
      "title": "体重趋势",
      "field": "weight",
      "description": "展示体重随时间的变化趋势"
    },
    {
      "id": "weekly-change",
      "type": "bar",
      "title": "周均环比",
      "field": "weight",
      "aggregate": "weekly",
      "calc": "change",
      "description": "每周平均体重变化"
    }
  ],
  "stats": [
    {
      "id": "total-change",
      "label": "总增长",
      "calc": "last - first",
      "unit": "斤",
      "precision": 1
    },
    {
      "id": "weekly-avg",
      "label": "周均增长",
      "calc": "weekly_avg_change",
      "unit": "斤/周",
      "precision": 2
    },
    {
      "id": "max",
      "label": "最高值",
      "calc": "max",
      "unit": "斤",
      "precision": 1
    },
    {
      "id": "min",
      "label": "最低值",
      "calc": "min",
      "unit": "斤",
      "precision": 1
    },
    {
      "id": "avg",
      "label": "平均值",
      "calc": "avg",
      "unit": "斤",
      "precision": 1
    }
  ],
  "suggestions": {
    "frequency": "每天早晚各一次",
    "tips": [
      "建议固定时间测量",
      "空腹或饭后 2 小时测量",
      "穿着相似重量的衣物"
    ]
  }
}
```

---

## 七、视觉设计规范

### 7.1 色彩体系

#### 主色调（清新风格）

```
主色：#10B981 (翡翠绿)
辅色：#3B82F6 (天空蓝)
强调：#F59E0B (琥珀黄)
```

#### 功能色

```
成功：#10B981
警告：#F59E0B
错误：#EF4444
信息：#3B82F6
```

#### 中性色

```
文字主色：#1F2937
文字次要：#6B7280
文字提示：#9CA3AF
边框：#E5E7EB
背景：#F9FAFB
```

---

### 7.2 字体规范

```
字体栈：-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif

字号：
- 大标题：20px (Mobile) / 24px (PC)
- 标题：18px / 20px
- 正文：16px / 16px
- 次要：14px / 14px
- 提示：12px / 12px

字重：
- 常规：400
- 中等：500
- 加粗：600
```

---

### 7.3 间距规范

```
基础单位：4px

间距等级：
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
```

---

### 7.4 圆角规范

```
小组件：4px
卡片：8px
大卡片：12px
按钮：6px
```

---

### 7.5 阴影规范

```
轻阴影：0 1px 2px rgba(0,0,0,0.05)
中阴影：0 4px 6px rgba(0,0,0,0.1)
重阴影：0 10px 15px rgba(0,0,0,0.1)
```

---

## 八、交互设计规范

### 8.1 加载状态

```
- 列表加载：骨架屏
- 页面加载：顶部进度条
- 操作加载：按钮 loading 状态
```

---

### 8.2 空状态

```
- 无记录集：显示引导创建
- 无数据：显示引导添加
- 无搜索结果：显示友好提示
```

---

### 8.3 错误处理

```
- 网络错误：重试按钮
- 数据错误：友好提示
- 操作失败：说明原因
```

---

### 8.4 反馈机制

```
- 成功：绿色 Toast，1 秒消失
- 失败：红色 Toast，3 秒消失
- 确认：弹窗确认
```

---

## 九、响应式断点

```
Mobile: < 640px
Tablet: 640px - 1024px
PC: > 1024px
```

### 布局适配

| 元素 | Mobile | Tablet | PC |
|:---:|:---:|:---:|:---:|
| 导航 | 底部 Tab | 侧边栏 | 侧边栏 |
| 卡片 | 单列 | 双列 | 三列 |
| 图表 | 全屏 | 80% | 60% |
| 表格 | 卡片化 | 简化 | 完整 |

---

## 十、技术实现要点

### 10.1 前端技术栈

```
框架：React 18 + Vite
UI：TailwindCSS + 自研组件
图表：ECharts 5
状态：Zustand
路由：React Router 6
HTTP：Axios
```

---

### 10.2 后端技术栈

```
框架：Express 4
语言：TypeScript 5
数据库：SQLite3
ORM：Better-SQLite3
验证：Zod
MCP：@modelcontextprotocol/sdk
```

---

### 10.3 关键实现

#### 模板引擎
- 模板加载：启动时加载内置 + 用户模板
- 模板渲染：根据模板配置动态生成表单和图表

#### 数据分析
- 趋势计算：线性回归
- 环比计算：周期对比
- 统计计算：基础统计函数

#### 图表渲染
- 移动端：简化交互
- PC 端：完整交互
- 响应式：自动适配

#### MCP 服务
- 协议：MCP (Model Context Protocol)
- 传输：stdio
- 工具注册：启动时注册所有工具
- 权限控制：可配置读写权限

---

## 十一、待确认事项

| 序号 | 事项 | 状态 | 说明 |
|:---:|:---:|:---:|:---:|
| 1 | 更多内置模板 | 待确认 | 身高、血压、血糖等 |
| 2 | 数据提醒功能 | 待确认 | 定时提醒记录 |
| 3 | 数据分享功能 | 待确认 | 生成报告分享 |
| 4 | 多语言支持 | 待确认 | 中英文切换 |
| 5 | 暗色主题 | 待确认 | 深色模式 |

---

## 十二、版本规划

### v1.0（MVP）
- 基础框架搭建
- 孕期体重模板
- 记录集管理
- 数据 CRUD
- 基础图表
- MCP Server 基础工具

### v1.1
- 更多内置模板（身高、血压、血糖）
- 数据导入导出
- 数据备份恢复
- MCP 工具完善

### v1.2
- 数据统计增强
- 更多图表类型
- 用户体验优化
- AI Agent 集成测试

---

## 十三、MCP 服务设计

### 13.1 MCP 服务概述

**定位：** 为 AI Agent 提供标准的成长数据读写接口

**核心价值：**
- AI 可以自动记录数据（如语音输入后自动保存）
- AI 可以分析数据并生成报告
- 支持自然语言查询（如"我上周体重变化多少？"）

---

### 13.2 MCP 工具列表

| 工具名 | 功能 | 输入 | 输出 |
|:---:|:---:|:---:|:---:|
| `create_record` | 创建记录集 | 模板 ID、名称、对象 | 记录集 ID |
| `list_records` | 获取记录集列表 | 无 | 记录集列表 |
| `get_record` | 获取记录集详情 | 记录集 ID | 记录集信息 + 统计 |
| `add_data` | 添加数据 | 记录集 ID、数据值、时间 | 数据 ID |
| `get_data` | 获取数据列表 | 记录集 ID、时间范围 | 数据列表 |
| `update_data` | 更新数据 | 数据 ID、新数据值 | 成功/失败 |
| `delete_data` | 删除数据 | 数据 ID | 成功/失败 |
| `get_stats` | 获取统计分析 | 记录集 ID、字段 | 统计结果 |
| `get_chart_data` | 获取图表数据 | 记录集 ID、图表 ID | 图表数据 |
| `delete_record` | 删除记录集 | 记录集 ID | 成功/失败 |

---

### 13.3 MCP 工具详细定义

#### create_record

```json
{
  "name": "create_record",
  "description": "创建一个新的成长记录集，用于记录特定类型的数据",
  "inputSchema": {
    "type": "object",
    "properties": {
      "template_id": {
        "type": "string",
        "description": "模板 ID，如 'pregnancy-weight'"
      },
      "name": {
        "type": "string",
        "description": "记录集名称，如 '我的孕期体重'"
      },
      "subject": {
        "type": "string",
        "description": "记录对象，如 '张三'"
      },
      "description": {
        "type": "string",
        "description": "备注说明"
      }
    },
    "required": ["template_id", "name"]
  }
}
```

**调用示例：**
```
AI: 帮我创建一个孕期体重记录集
MCP: create_record({
  "template_id": "pregnancy-weight",
  "name": "孕期体重记录",
  "subject": "张三"
})
→ { "id": 1 }
```

---

#### add_data

```json
{
  "name": "add_data",
  "description": "向指定记录集添加一条数据记录",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": {
        "type": "integer",
        "description": "记录集 ID"
      },
      "values": {
        "type": "object",
        "description": "数据值，键名对应模板字段",
        "additionalProperties": true
      },
      "timestamp": {
        "type": "string",
        "description": "记录时间，ISO 格式，默认当前时间"
      },
      "note": {
        "type": "string",
        "description": "备注信息"
      }
    },
    "required": ["record_id", "values"]
  }
}
```

**调用示例：**
```
AI: 记录今天体重 120.5 斤
MCP: add_data({
  "record_id": 1,
  "values": { "weight": 120.5 },
  "note": "早餐后"
})
→ { "id": 101, "success": true }
```

---

#### get_data

```json
{
  "name": "get_data",
  "description": "获取指定记录集的数据列表，支持时间范围筛选",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": {
        "type": "integer",
        "description": "记录集 ID"
      },
      "start_date": {
        "type": "string",
        "description": "开始日期，ISO 格式"
      },
      "end_date": {
        "type": "string",
        "description": "结束日期，ISO 格式"
      },
      "limit": {
        "type": "integer",
        "description": "返回数量限制，默认 20"
      }
    },
    "required": ["record_id"]
  }
}
```

**调用示例：**
```
AI: 查看我上周的体重记录
MCP: get_data({
  "record_id": 1,
  "start_date": "2026-03-24",
  "end_date": "2026-03-30"
})
→ {
  "list": [
    { "timestamp": "2026-03-30", "values": { "weight": 120.0 } },
    { "timestamp": "2026-03-29", "values": { "weight": 119.5 } }
  ]
}
```

---

#### get_stats

```json
{
  "name": "get_stats",
  "description": "获取记录集的统计分析数据",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": {
        "type": "integer",
        "description": "记录集 ID"
      },
      "field": {
        "type": "string",
        "description": "字段名，如 'weight'"
      }
    },
    "required": ["record_id"]
  }
}
```

**调用示例：**
```
AI: 分析一下我的体重变化
MCP: get_stats({
  "record_id": 1,
  "field": "weight"
})
→ {
  "total_change": 10.5,
  "weekly_avg": 0.8,
  "max": 125.0,
  "min": 110.0,
  "avg": 118.5,
  "count": 15
}
```

---

#### get_chart_data

```json
{
  "name": "get_chart_data",
  "description": "获取记录集的图表数据，用于可视化展示",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": {
        "type": "integer",
        "description": "记录集 ID"
      },
      "chart_id": {
        "type": "string",
        "description": "图表 ID，如 'trend'"
      },
      "field": {
        "type": "string",
        "description": "字段名"
      }
    },
    "required": ["record_id", "chart_id"]
  }
}
```

**调用示例：**
```
AI: 生成体重趋势图的数据
MCP: get_chart_data({
  "record_id": 1,
  "chart_id": "trend",
  "field": "weight"
})
→ {
  "chart_id": "trend",
  "title": "体重趋势",
  "data": [
    { "timestamp": "2026-03-01", "value": 110.0 },
    { "timestamp": "2026-03-02", "value": 110.5 }
  ]
}
```

---

#### list_records

```json
{
  "name": "list_records",
  "description": "获取所有记录集列表",
  "inputSchema": {
    "type": "object",
    "properties": {
      "template_id": {
        "type": "string",
        "description": "按模板筛选，可选"
      }
    }
  }
}
```

**调用示例：**
```
AI: 我有哪些记录集？
MCP: list_records()
→ {
  "list": [
    { "id": 1, "name": "孕期体重", "template_id": "pregnancy-weight" },
    { "id": 2, "name": "宝宝身高", "template_id": "height" }
  ]
}
```

---

#### get_record

```json
{
  "name": "get_record",
  "description": "获取指定记录集的详细信息，包括统计和图表配置",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": {
        "type": "integer",
        "description": "记录集 ID"
      }
    },
    "required": ["record_id"]
  }
}
```

---

#### update_data

```json
{
  "name": "update_data",
  "description": "更新已有数据记录",
  "inputSchema": {
    "type": "object",
    "properties": {
      "data_id": {
        "type": "integer",
        "description": "数据记录 ID"
      },
      "values": {
        "type": "object",
        "description": "新的数据值"
      },
      "timestamp": {
        "type": "string",
        "description": "新的记录时间"
      },
      "note": {
        "type": "string",
        "description": "新的备注"
      }
    },
    "required": ["data_id"]
  }
}
```

---

#### delete_data

```json
{
  "name": "delete_data",
  "description": "删除指定的数据记录",
  "inputSchema": {
    "type": "object",
    "properties": {
      "data_id": {
        "type": "integer",
        "description": "数据记录 ID"
      }
    },
    "required": ["data_id"]
  }
}
```

---

#### delete_record

```json
{
  "name": "delete_record",
  "description": "删除整个记录集及其所有数据",
  "inputSchema": {
    "type": "object",
    "properties": {
      "record_id": {
        "type": "integer",
        "description": "记录集 ID"
      }
    },
    "required": ["record_id"]
  }
}
```

---

### 13.4 MCP Server 配置

#### 配置文件

```json
{
  "mcpServers": {
    "growth-record": {
      "command": "node",
      "args": ["/path/to/growth-record-mcp-server.js"],
      "env": {
        "DATABASE_PATH": "/path/to/growth-record.db",
        "PORT": "3000"
      }
    }
  }
}
```

#### 启动方式

```bash
# 方式 1：独立进程
node mcp-server.js

# 方式 2：作为主服务的子模块
node server.js --enable-mcp
```

---

### 13.5 MCP Server 实现结构

```
mcp-server/
├── index.js              # MCP Server 入口
├── tools/
│   ├── create_record.js  # 创建记录集
│   ├── add_data.js       # 添加数据
│   ├── get_data.js       # 获取数据
│   ├── get_stats.js      # 统计分析
│   └── ...
├── db/
│   └── sqlite.js         # 数据库操作
└── utils/
    └── template.js       # 模板引擎
```

---

### 13.6 AI Agent 使用场景

#### 场景 1：语音记录

```
用户：我今天体重 120.5 斤
AI → MCP: add_data({ record_id: 1, values: { weight: 120.5 } })
AI: 好的，已记录今天体重 120.5 斤
```

#### 场景 2：数据分析

```
用户：我最近体重变化怎么样？
AI → MCP: get_stats({ record_id: 1, field: 'weight' })
AI → MCP: get_data({ record_id: 1, limit: 7 })
AI: 你最近 7 天体重从 119 斤增长到 120.5 斤，周均增长 0.25 斤
```

#### 场景 3：自动生成报告

```
用户：生成一份周报
AI → MCP: get_chart_data({ record_id: 1, chart_id: 'weekly-change' })
AI: [生成包含图表和分析的周报]
```

#### 场景 4：异常提醒

```
AI → MCP: get_stats({ record_id: 1 })
AI: 注意，本周体重增长 1.5 斤，超过建议的 0.5 斤/周
```

---

### 13.7 安全控制

#### 权限设计

| 操作 | 权限级别 | 说明 |
|:---:|:---:|:---:|
| 读取数据 | 只读 | 可查看所有记录集 |
| 添加数据 | 写入 | 可添加新数据 |
| 修改数据 | 写入 | 可修改已有数据 |
| 删除数据 | 删除 | 可删除数据/记录集 |
| 创建记录集 | 管理 | 可创建新记录集 |

#### 配置示例

```json
{
  "mcp": {
    "enabled": true,
    "permissions": {
      "read": true,
      "write": true,
      "delete": false
    },
    "allowed_records": [1, 2, 3],
    "rate_limit": {
      "requests_per_minute": 60
    }
  }
}
```

---

### 13.8 错误处理

#### 错误码设计

| 错误码 | 说明 | 处理 |
|:---:|:---:|:---:|
| 1001 | 记录集不存在 | 提示创建记录集 |
| 1002 | 模板不存在 | 检查模板 ID |
| 1003 | 数据格式错误 | 验证字段类型 |
| 1004 | 权限不足 | 提示需要授权 |
| 1005 | 频率限制 | 稍后重试 |

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": 1001,
    "message": "记录集不存在",
    "details": "记录集 ID 1 未找到"
  }
}
```

---

### 13.9 技术架构图

```
┌─────────────────────────────────────────┐
│         前端 (Vite + React)             │
│   - PC 端 + 移动端响应式设计             │
│   - ECharts 图表                        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      后端 (Express + TypeScript)        │
│   - RESTful API                         │
│   - 模板插件系统                         │
│   - 数据分析引擎                         │
│   - MCP Server                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        数据库 (SQLite)                  │
│   - 单文件存储                           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      MCP Clients (AI Agents)            │
│   - Claude Code                         │
│   - 其他 ACP Agent                      │
└─────────────────────────────────────────┘
```

---

## 附录

### A. 术语表

| 术语 | 说明 |
|:---:|:---:|
| 模板 | 定义记录字段和分析方式的配置 |
| 记录集 | 用户创建的具体数据记录集合 |
| 数据记录 | 单次的数值记录 |
| MCP | Model Context Protocol，AI Agent 通信协议 |

### B. 参考资料

- [Model Context Protocol 文档](https://modelcontextprotocol.io/)
- [ECharts 文档](https://echarts.apache.org/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [Express 文档](https://expressjs.com/)

---

**文档结束**

---

*最后更新：2026-03-31*  
*维护者：豆点 🫘*
