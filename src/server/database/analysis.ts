/**
 * 数据分析服务
 * 提供身高体重数据的趋势分析、同比、环比等功能
 */

import { getDatabase } from './index';

interface DataPoint {
  date: string;
  height: number | null;
  weight: number | null;
}

interface MonthlyData {
  year: number;
  month: number;
  avgHeight: number | null;
  avgWeight: number | null;
}

/**
 * 获取数据趋势（按日聚合，一日多次取平均）
 */
export function getTrendData(rulerId: number): DataPoint[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      record_date as date,
      AVG(height) as height,
      AVG(weight) as weight
    FROM records
    WHERE ruler_id = ?
    GROUP BY record_date
    ORDER BY record_date ASC
  `);
  return stmt.all(rulerId) as DataPoint[];
}

/**
 * 获取月度平均值数据
 */
function getMonthlyAverages(rulerId: number): MonthlyData[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      strftime('%Y', record_date) as year,
      strftime('%m', record_date) as month,
      AVG(height) as avgHeight,
      AVG(weight) as avgWeight
    FROM records
    WHERE ruler_id = ?
    GROUP BY strftime('%Y-%m', record_date)
    ORDER BY year, month
  `);

  const results = stmt.all(rulerId) as { year: string; month: string; avgHeight: number | null; avgWeight: number | null }[];

  return results.map(r => ({
    year: parseInt(r.year),
    month: parseInt(r.month),
    avgHeight: r.avgHeight,
    avgWeight: r.avgWeight,
  }));
}

/**
 * 获取当前年月
 */
function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * 月均同比（本月 vs 去年同月）
 */
export function getMonthlyComparison(rulerId: number): {
  currentMonth: { year: number; month: number; avgHeight: number | null; avgWeight: number | null } | null;
  lastYearSameMonth: { year: number; month: number; avgHeight: number | null; avgWeight: number | null } | null;
  message: string;
} {
  const { year, month } = getCurrentYearMonth();
  const monthlyData = getMonthlyAverages(rulerId);

  const currentMonthData = monthlyData.find(d => d.year === year && d.month === month) || null;
  const lastYearSameMonthData = monthlyData.find(d => d.year === year - 1 && d.month === month) || null;

  if (!currentMonthData) {
    return {
      currentMonth: null,
      lastYearSameMonth: null,
      message: '数据不足',
    };
  }

  return {
    currentMonth: currentMonthData,
    lastYearSameMonth: lastYearSameMonthData,
    message: lastYearSameMonthData ? '对比成功' : '数据不足（无去年同月数据）',
  };
}

/**
 * 月环比（本月 vs 上月）
 */
export function getMonthlyPeriodComparison(rulerId: number): {
  currentMonth: { avgHeight: number | null; avgWeight: number | null } | null;
  lastMonth: { avgHeight: number | null; avgWeight: number | null } | null;
  message: string;
} {
  const { year, month } = getCurrentYearMonth();
  const monthlyData = getMonthlyAverages(rulerId);

  const currentMonthData = monthlyData.find(d => d.year === year && d.month === month) || null;

  // 计算上月
  let lastYear = year;
  let lastMonth = month - 1;
  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear -= 1;
  }
  const lastMonthData = monthlyData.find(d => d.year === lastYear && d.month === lastMonth) || null;

  if (!currentMonthData) {
    return {
      currentMonth: null,
      lastMonth: null,
      message: '数据不足',
    };
  }

  return {
    currentMonth: { avgHeight: currentMonthData.avgHeight, avgWeight: currentMonthData.avgWeight },
    lastMonth: lastMonthData ? { avgHeight: lastMonthData.avgHeight, avgWeight: lastMonthData.avgWeight } : null,
    message: lastMonthData ? '对比成功' : '数据不足（无上月数据）',
  };
}

/**
 * 周环比（本周 vs 上周）
 */
export function getWeeklyPeriodComparison(rulerId: number): {
  currentWeek: { avgHeight: number | null; avgWeight: number | null } | null;
  lastWeek: { avgHeight: number | null; avgWeight: number | null } | null;
  message: string;
} {
  const db = getDatabase();
  const now = new Date();

  // 计算本周的起止日期（周一到周日）
  const getWeekRange = (date: Date) => {
    const day = date.getDay() || 7; // 周日为 0，转为 7
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
  };

  const currentWeekRange = getWeekRange(now);
  const lastWeekStart = new Date(currentWeekRange.start);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(currentWeekRange.start);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  const lastWeekRange = {
    start: lastWeekStart.toISOString().split('T')[0],
    end: lastWeekEnd.toISOString().split('T')[0],
  };

  const getWeekAverage = (start: string, end: string) => {
    const stmt = db.prepare(`
      SELECT AVG(height) as avgHeight, AVG(weight) as avgWeight
      FROM records
      WHERE ruler_id = ? AND record_date BETWEEN ? AND ?
    `);
    return stmt.get(rulerId, start, end) as { avgHeight: number | null; avgWeight: number | null };
  };

  const currentWeekAvg = getWeekAverage(currentWeekRange.start, currentWeekRange.end);
  const lastWeekAvg = getWeekAverage(lastWeekRange.start, lastWeekRange.end);

  if (!currentWeekAvg.avgHeight && !currentWeekAvg.avgWeight) {
    return {
      currentWeek: null,
      lastWeek: null,
      message: '数据不足',
    };
  }

  return {
    currentWeek: currentWeekAvg,
    lastWeek: lastWeekAvg.avgHeight || lastWeekAvg.avgWeight ? lastWeekAvg : null,
    message: lastWeekAvg.avgHeight || lastWeekAvg.avgWeight ? '对比成功' : '数据不足（无上周数据）',
  };
}

/**
 * 获取完整分析数据
 */
export function getFullAnalysis(rulerId: number) {
  return {
    trend: getTrendData(rulerId),
    monthlyComparison: getMonthlyComparison(rulerId),
    monthlyPeriodComparison: getMonthlyPeriodComparison(rulerId),
    weeklyPeriodComparison: getWeeklyPeriodComparison(rulerId),
  };
}
