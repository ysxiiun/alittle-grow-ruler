/**
 * 模板 API 路由
 */

import { Router, Request, Response } from 'express';
import { getAllTemplates, getTemplateById } from '../templates';

const router = Router();

/**
 * GET /api/templates
 * 获取模板列表
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const templates = getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: '获取模板失败' });
  }
});

/**
 * GET /api/templates/:id
 * 获取模板详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = getTemplateById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, message: '获取模板失败' });
  }
});

export default router;
