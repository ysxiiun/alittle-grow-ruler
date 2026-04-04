/**
 * 记录集 API 路由
 * 重构：支持模板系统，使用新的数据结构
 */

import { Router, Request, Response } from 'express';
import * as recordsDao from '../database/records';
import * as dataEntriesDao from '../database/dataEntries';
import { getTemplateById } from '../templates';

const router = Router();

/**
 * GET /api/rulers
 * 获取所有记录集（支持搜索、模板筛选）
 * 兼容旧 API，返回新数据结构
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, template_type, template_id } = req.query;
    const options = {
      search: search as string | undefined,
      template_id: (template_id || template_type) as string | undefined,
    };
    const records = recordsDao.findAll(options);

    // 获取每个记录集的统计信息
    const recordsWithStats = records.map(record => {
      const stats = recordsDao.getStats(record.id!);
      return {
        ...record,
        record_count: stats.count,
        last_time: stats.last_time,
      };
    });

    res.json({ success: true, data: recordsWithStats });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ success: false, message: '获取记录集失败' });
  }
});

/**
 * GET /api/rulers/:id
 * 获取单个记录集详情（含模板信息和统计）
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }

    const record = recordsDao.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    // 获取模板信息
    const template = getTemplateById(record.template_id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    // 获取统计信息
    const stats = recordsDao.getStats(id);

    // 获取最近的数据条目
    const recentData = dataEntriesDao.findAll({
      record_id: id,
      page: 1,
      pageSize: 5,
    });

    res.json({
      success: true,
      data: {
        ...record,
        template,
        stats,
        recent_entries: recentData.entries,
      },
    });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ success: false, message: '获取记录集失败' });
  }
});

/**
 * POST /api/rulers
 * 创建记录集
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, template_id, subject, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '名称不能为空' });
    }

    // 验证模板存在
    const template = getTemplateById(template_id || 'height-weight');
    if (!template) {
      return res.status(400).json({ success: false, message: '模板不存在' });
    }

    const record = recordsDao.create({
      template_id: template.id,
      name,
      description: description || '',
      subject,
      color,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ success: false, message: '创建记录集失败' });
  }
});

/**
 * PUT /api/rulers/:id
 * 更新记录集
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }

    const { name, description, subject, color } = req.body;
    const updated = recordsDao.update(id, { name, description, subject, color });

    if (!updated) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ success: false, message: '更新记录集失败' });
  }
});

/**
 * DELETE /api/rulers/:id
 * 软删除记录集
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }

    const deleted = recordsDao.softDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ success: false, message: '删除记录集失败' });
  }
});

// ==================== 数据条目相关 API ====================

/**
 * GET /api/rulers/:id/data
 * 获取记录集的数据列表（支持分页和时间范围）
 */
router.get('/:id/data', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }

    const { page, pageSize, start_date, end_date } = req.query;
    const result = dataEntriesDao.findAll({
      record_id: id,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching data entries:', error);
    res.status(500).json({ success: false, message: '获取数据失败' });
  }
});

/**
 * POST /api/rulers/:id/data
 * 添加数据条目
 */
router.post('/:id/data', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }

    // 检查记录集存在
    const record = recordsDao.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    const { timestamp, values, note } = req.body;
    if (!timestamp) {
      return res.status(400).json({ success: false, message: '时间不能为空' });
    }

    const entry = dataEntriesDao.create({
      record_id: id,
      timestamp,
      values: values || {},
      note,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating data entry:', error);
    res.status(500).json({ success: false, message: '添加数据失败' });
  }
});

/**
 * PUT /api/rulers/:id/data/:dataId
 * 更新数据条目
 */
router.put('/:id/data/:dataId', (req: Request, res: Response) => {
  try {
    const dataId = parseInt(req.params.dataId);
    if (isNaN(dataId)) {
      return res.status(400).json({ success: false, message: '无效的数据 ID' });
    }

    const { timestamp, values, note } = req.body;
    const updated = dataEntriesDao.update(dataId, { timestamp, values, note });

    if (!updated) {
      return res.status(404).json({ success: false, message: '数据不存在' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating data entry:', error);
    res.status(500).json({ success: false, message: '更新数据失败' });
  }
});

/**
 * DELETE /api/rulers/:id/data/:dataId
 * 删除数据条目
 */
router.delete('/:id/data/:dataId', (req: Request, res: Response) => {
  try {
    const dataId = parseInt(req.params.dataId);
    if (isNaN(dataId)) {
      return res.status(400).json({ success: false, message: '无效的数据 ID' });
    }

    const deleted = dataEntriesDao.remove(dataId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '数据不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting data entry:', error);
    res.status(500).json({ success: false, message: '删除数据失败' });
  }
});

export default router;
