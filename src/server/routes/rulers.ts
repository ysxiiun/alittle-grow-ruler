/**
 * 记录尺 API 路由
 */

import { Router, Request, Response } from 'express';
import * as rulersDao from '../database/rulers';

const router = Router();

/**
 * GET /api/rulers
 * 获取所有记录尺（支持搜索、模板筛选）
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, template_type } = req.query;
    const options = {
      search: search as string | undefined,
      template_type: template_type as string | undefined,
    };
    const result = rulersDao.findAll(options);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching rulers:', error);
    res.status(500).json({ success: false, message: '获取记录尺失败' });
  }
});

/**
 * GET /api/rulers/:id
 * 获取单个记录尺详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const ruler = rulersDao.findById(id);
    if (!ruler) {
      return res.status(404).json({ success: false, message: '记录尺不存在' });
    }
    res.json({ success: true, data: ruler });
  } catch (error) {
    console.error('Error fetching ruler:', error);
    res.status(500).json({ success: false, message: '获取记录尺失败' });
  }
});

/**
 * POST /api/rulers
 * 创建记录尺
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, template_type } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: '名称不能为空' });
    }
    const ruler = rulersDao.create({
      name,
      description: description || '',
      template_type: template_type || 'height_weight',
    });
    res.status(201).json({ success: true, data: ruler });
  } catch (error) {
    console.error('Error creating ruler:', error);
    res.status(500).json({ success: false, message: '创建记录尺失败' });
  }
});

/**
 * PUT /api/rulers/:id
 * 更新记录尺
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const { name, description, template_type } = req.body;
    const updated = rulersDao.update(id, { name, description, template_type });
    if (!updated) {
      return res.status(404).json({ success: false, message: '记录尺不存在' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating ruler:', error);
    res.status(500).json({ success: false, message: '更新记录尺失败' });
  }
});

/**
 * DELETE /api/rulers/:id
 * 删除记录尺
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const deleted = rulersDao.remove(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '记录尺不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting ruler:', error);
    res.status(500).json({ success: false, message: '删除记录尺失败' });
  }
});

export default router;
