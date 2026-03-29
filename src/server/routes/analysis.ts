/**
 * 数据分析 API 路由
 */

import { Router, Request, Response } from 'express';
import * as analysisService from '../database/analysis';

const router = Router();

/**
 * GET /api/analysis/trend/:rulerId
 * 获取数据趋势
 */
router.get('/trend/:rulerId', (req: Request, res: Response) => {
  try {
    const rulerId = parseInt(req.params.rulerId);
    if (isNaN(rulerId)) {
      return res.status(400).json({ success: false, message: '无效的 rulerId' });
    }
    const trend = analysisService.getTrendData(rulerId);
    res.json({ success: true, data: trend });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ success: false, message: '获取趋势数据失败' });
  }
});

/**
 * GET /api/analysis/monthly-compare/:rulerId
 * 获取月均同比（本月 vs 去年同月）
 */
router.get('/monthly-compare/:rulerId', (req: Request, res: Response) => {
  try {
    const rulerId = parseInt(req.params.rulerId);
    if (isNaN(rulerId)) {
      return res.status(400).json({ success: false, message: '无效的 rulerId' });
    }
    const comparison = analysisService.getMonthlyComparison(rulerId);
    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({ success: false, message: '获取同比数据失败' });
  }
});

/**
 * GET /api/analysis/period-compare/:rulerId
 * 获取周期环比（月环比、周环比）
 */
router.get('/period-compare/:rulerId', (req: Request, res: Response) => {
  try {
    const rulerId = parseInt(req.params.rulerId);
    if (isNaN(rulerId)) {
      return res.status(400).json({ success: false, message: '无效的 rulerId' });
    }
    const monthlyComparison = analysisService.getMonthlyPeriodComparison(rulerId);
    const weeklyComparison = analysisService.getWeeklyPeriodComparison(rulerId);
    res.json({
      success: true,
      data: {
        monthly: monthlyComparison,
        weekly: weeklyComparison,
      },
    });
  } catch (error) {
    console.error('Error fetching period comparison:', error);
    res.status(500).json({ success: false, message: '获取环比数据失败' });
  }
});

/**
 * GET /api/analysis/full/:rulerId
 * 获取完整分析数据
 */
router.get('/full/:rulerId', (req: Request, res: Response) => {
  try {
    const rulerId = parseInt(req.params.rulerId);
    if (isNaN(rulerId)) {
      return res.status(400).json({ success: false, message: '无效的 rulerId' });
    }
    const analysis = analysisService.getFullAnalysis(rulerId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error fetching full analysis:', error);
    res.status(500).json({ success: false, message: '获取分析数据失败' });
  }
});

export default router;
