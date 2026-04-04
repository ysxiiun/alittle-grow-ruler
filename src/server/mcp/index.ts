/**
 * MCP (Model Context Protocol) 服务
 * 为 AI Agent 提供标准的数据读写接口
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as recordsDao from '../database/records';
import * as dataEntriesDao from '../database/dataEntries';
import * as templatesDao from '../database/templates';
import * as analysisDao from '../database/analysis';

// 创建 MCP Server
const server = new McpServer({
  name: 'growth-record',
  version: '1.0.0',
});

// ==================== 工具定义 ====================

// create_record - 创建记录集
server.tool(
  'create_record',
  '创建一个新的成长记录集，用于记录特定类型的数据',
  {
    template_id: z.string().describe('模板 ID，如 height-weight, pregnancy-weight'),
    name: z.string().describe('记录集名称'),
    subject: z.string().optional().describe('记录对象名称'),
    description: z.string().optional().describe('备注说明'),
  },
  async ({ template_id, name, subject, description }) => {
    try {
      const record = recordsDao.create({
        template_id,
        name,
        subject,
        description,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, id: record.id }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// list_records - 获取记录集列表
server.tool(
  'list_records',
  '获取所有记录集列表',
  {
    template_id: z.string().optional().describe('按模板筛选'),
  },
  async ({ template_id }) => {
    try {
      const records = recordsDao.findAll({ template_id });
      const result = records.map((r) => ({
        id: r.id,
        name: r.name,
        template_id: r.template_id,
        subject: r.subject,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, list: result }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// get_record - 获取记录集详情
server.tool(
  'get_record',
  '获取指定记录集的详细信息',
  {
    record_id: z.number().describe('记录集 ID'),
  },
  async ({ record_id }) => {
    try {
      const record = recordsDao.findById(record_id);
      if (!record) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: '记录集不存在' }) }],
        };
      }
      const template = templatesDao.findById(record.template_id);
      const stats = recordsDao.getStats(record_id);
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, record, template, stats }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// add_data - 添加数据
server.tool(
  'add_data',
  '向指定记录集添加一条数据记录',
  {
    record_id: z.number().describe('记录集 ID'),
    values: z.record(z.union([z.number(), z.string(), z.null()])).describe('数据值'),
    timestamp: z.string().optional().describe('记录时间，ISO 格式，默认当前时间'),
    note: z.string().optional().describe('备注信息'),
  },
  async ({ record_id, values, timestamp, note }) => {
    try {
      const entry = dataEntriesDao.create({
        record_id,
        timestamp: timestamp || new Date().toISOString(),
        values,
        note,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, id: entry.id }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// get_data - 获取数据列表
server.tool(
  'get_data',
  '获取指定记录集的数据列表',
  {
    record_id: z.number().describe('记录集 ID'),
    start_date: z.string().optional().describe('开始日期'),
    end_date: z.string().optional().describe('结束日期'),
    limit: z.number().optional().describe('返回数量限制'),
  },
  async ({ record_id, start_date, end_date, limit }) => {
    try {
      const result = dataEntriesDao.findAll({
        record_id,
        start_date,
        end_date,
        page: 1,
        pageSize: limit || 20,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, list: result.entries, total: result.total }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// update_data - 更新数据
server.tool(
  'update_data',
  '更新已有数据记录',
  {
    data_id: z.number().describe('数据记录 ID'),
    values: z.record(z.union([z.number(), z.string(), z.null()])).optional().describe('新的数据值'),
    timestamp: z.string().optional().describe('新的记录时间'),
    note: z.string().optional().describe('新的备注'),
  },
  async ({ data_id, values, timestamp, note }) => {
    try {
      const updated = dataEntriesDao.update(data_id, { values, timestamp, note });
      if (!updated) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: '数据不存在' }) }],
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// delete_data - 删除数据
server.tool(
  'delete_data',
  '删除指定的数据记录',
  {
    data_id: z.number().describe('数据记录 ID'),
  },
  async ({ data_id }) => {
    try {
      const deleted = dataEntriesDao.remove(data_id);
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: deleted }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// get_stats - 获取统计分析
server.tool(
  'get_stats',
  '获取记录集的统计分析数据',
  {
    record_id: z.number().describe('记录集 ID'),
    field: z.string().optional().describe('字段名'),
  },
  async ({ record_id, field }) => {
    try {
      const stats = analysisDao.calculateStats(record_id, field || 'weight');
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, ...stats }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// get_chart_data - 获取图表数据
server.tool(
  'get_chart_data',
  '获取记录集的图表数据，用于可视化展示',
  {
    record_id: z.number().describe('记录集 ID'),
    chart_id: z.string().optional().describe('图表 ID'),
    field: z.string().optional().describe('字段名'),
  },
  async ({ record_id, chart_id, field }) => {
    try {
      const chartData = analysisDao.getChartData(record_id, chart_id || 'trend', field || 'weight');
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, ...chartData }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// delete_record - 删除记录集
server.tool(
  'delete_record',
  '删除整个记录集（软删除）',
  {
    record_id: z.number().describe('记录集 ID'),
  },
  async ({ record_id }) => {
    try {
      const deleted = recordsDao.softDelete(record_id);
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: deleted }) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: (error as Error).message }) }],
      };
    }
  }
);

// ==================== 启动服务 ====================

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server started');
}

// 直接运行时启动
if (process.argv[1]?.includes('mcp')) {
  startMcpServer().catch(console.error);
}
