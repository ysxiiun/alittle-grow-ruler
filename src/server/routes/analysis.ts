/**
 * 数据分析 API 路由
 * 重构：支持模板系统和动态字段
 */

import { Router, Request, Response } from 'express';
import * as analysisService from '../database/analysis';
import * as recordsDao from '../database/records';
import { getTemplateById } from '../templates';

const router = Router();

function resolveAnalysisField(recordId: number, requestedField?: string): string {
  if (requestedField) {
    return requestedField;
  }

  const record = recordsDao.findById(recordId);
  if (!record) {
    return 'weight';
  }

  const template = getTemplateById(record.template_id);
  if (!template) {
    return 'weight';
  }

  if (template.id === 'pregnancy-weight') {
    return 'weight_mean';
  }

  return template.fields[0]?.key || 'weight';
}

/**
 * GET /api/analysis/stats/:recordId
 * 获取统计分析数据
 */
router.get('/stats/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const { field } = req.query;
    const fieldStr = resolveAnalysisField(recordId, field as string | undefined);

    const stats = analysisService.calculateStats(recordId, fieldStr);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

/**
 * GET /api/analysis/chart/:recordId
 * 获取图表数据
 */
router.get('/chart/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const { chart_id, field } = req.query;
    const chartId = (chart_id as string) || 'trend';
    const record = recordsDao.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    const template = getTemplateById(record.template_id);
    const chartConfig = template?.charts.find((chart) => chart.id === chartId);

    const chartData = analysisService.getChartData(recordId, chartId, chartConfig?.field || resolveAnalysisField(recordId, field as string | undefined), {
      title: chartConfig?.title,
      fields: chartConfig?.fields,
      aggregate: chartConfig?.aggregate,
      calc: chartConfig?.calc,
    });
    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ success: false, message: '获取图表数据失败' });
  }
});

/**
 * GET /api/analysis/trend/:recordId
 * 获取数据趋势
 */
router.get('/trend/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const { field } = req.query;
    const fieldStr = resolveAnalysisField(recordId, field as string | undefined);

    const trend = analysisService.getTrendData(recordId, fieldStr);
    res.json({ success: true, data: trend });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ success: false, message: '获取趋势数据失败' });
  }
});

/**
 * GET /api/analysis/monthly-compare/:recordId
 * 获取月均同比（本月 vs 去年同月）
 */
router.get('/monthly-compare/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const { field } = req.query;
    const fieldStr = resolveAnalysisField(recordId, field as string | undefined);

    const comparison = analysisService.getMonthlyComparison(recordId, fieldStr);
    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({ success: false, message: '获取同比数据失败' });
  }
});

/**
 * GET /api/analysis/period-compare/:recordId
 * 获取周期环比（月环比、周环比）
 */
router.get('/period-compare/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const { field } = req.query;
    const fieldStr = resolveAnalysisField(recordId, field as string | undefined);

    const monthlyComparison = analysisService.getMonthlyPeriodComparison(recordId, fieldStr);
    const weeklyComparison = analysisService.getWeeklyPeriodComparison(recordId, fieldStr);

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
 * GET /api/analysis/full/:recordId
 * 获取完整分析数据
 */
router.get('/full/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const { field } = req.query;

    // 获取记录集信息以确定模板
    const record = recordsDao.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    // 获取模板
    const template = getTemplateById(record.template_id);

    // 根据模板或查询参数确定字段
    const fieldStr = resolveAnalysisField(recordId, field as string | undefined);

    const analysis = analysisService.getFullAnalysis(recordId, fieldStr);

    // 根据模板计算所有统计值
    let templateStats: Record<string, number | null> = {};
    if (template) {
      for (const statConfig of template.stats) {
        const value = analysisService.calculateStat(recordId, statConfig);
        templateStats[statConfig.id] = value;
      }
    }

    res.json({
      success: true,
      data: {
        ...analysis,
        template_stats: templateStats,
        template,
      },
    });
  } catch (error) {
    console.error('Error fetching full analysis:', error);
    res.status(500).json({ success: false, message: '获取分析数据失败' });
  }
});

export default router;
