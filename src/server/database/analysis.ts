/**
 * 数据分析服务
 * 支持通用模板分析与孕期体重专用聚合逻辑
 */

import dayjs from 'dayjs';
import { getDatabase } from './index';
import type { TemplateStat } from './templates';

export interface DataPoint {
  timestamp: string;
  value: number;
}

interface ChartSeries {
  field: string;
  data: DataPoint[];
}

interface PregnancyDayMetric {
  timestamp: string;
  morning: number | null;
  night: number | null;
  mean: number | null;
  estimated: boolean;
}

interface MonthlyData {
  year: number;
  month: number;
  avg_value: number;
}

const PREGNANCY_TEMPLATE_ID = 'pregnancy-weight';
const PREGNANCY_MEAN_FIELD = 'weight_mean';
const PREGNANCY_MORNING_FIELD = 'weight_morning';
const PREGNANCY_NIGHT_FIELD = 'weight_night';
const PREGNANCY_FIELDS = new Set([
  PREGNANCY_MEAN_FIELD,
  PREGNANCY_MORNING_FIELD,
  PREGNANCY_NIGHT_FIELD,
]);

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRecordTemplateId(record_id: number): string | undefined {
  const db = getDatabase();
  const row = db.prepare('SELECT template_id FROM records WHERE id = ?').get(record_id) as
    | { template_id: string }
    | undefined;
  return row?.template_id;
}

function isPregnancyField(record_id: number, field: string): boolean {
  return getRecordTemplateId(record_id) === PREGNANCY_TEMPLATE_ID && PREGNANCY_FIELDS.has(field);
}

function getWeekStart(dateString: string): string {
  const date = dayjs(dateString);
  const day = date.day() || 7;
  return date.subtract(day - 1, 'day').format('YYYY-MM-DD');
}

function getGenericTrendData(record_id: number, field: string): DataPoint[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT
      COALESCE(data_date, strftime('%Y-%m-%d', timestamp)) as day,
      AVG(json_extract("values", '$.${field}')) as avg_value
    FROM data_entries
    WHERE record_id = ? AND json_extract("values", '$.${field}') IS NOT NULL
    GROUP BY day
    ORDER BY day ASC
  `);

  const rows = stmt.all(record_id) as Array<{
    day: string;
    avg_value: number;
  }>;

  return rows.map((row) => ({
    timestamp: row.day,
    value: row.avg_value,
  }));
}

function getPregnancyDailyMetrics(record_id: number): PregnancyDayMetric[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT timestamp, COALESCE(data_date, strftime('%Y-%m-%d', timestamp)) as data_date, "values"
    FROM data_entries
    WHERE record_id = ?
    ORDER BY COALESCE(data_date, strftime('%Y-%m-%d', timestamp)) ASC, timestamp ASC, created_at ASC
  `).all(record_id) as Array<{
    timestamp: string;
    data_date: string;
    values: string;
  }>;

  const dayMap = new Map<string, { morning: number[]; night: number[] }>();

  for (const row of rows) {
    const values = JSON.parse(row.values || '{}') as Record<string, number | string | null>;
    const weight = typeof values.weight === 'number' ? values.weight : null;
    const period = values.weight_period;
    if (weight === null || (period !== 'morning' && period !== 'night')) {
      continue;
    }

    const day = row.data_date;
    const bucket = dayMap.get(day) || { morning: [], night: [] };
    bucket[period].push(weight);
    dayMap.set(day, bucket);
  }

  const sortedDays = Array.from(dayMap.keys()).sort();
  const allCompleteDeltas = sortedDays
    .map((day) => {
      const bucket = dayMap.get(day)!;
      const morning = average(bucket.morning);
      const night = average(bucket.night);
      return morning !== null && night !== null ? night - morning : null;
    })
    .filter((delta): delta is number => delta !== null);
  const globalDelta = allCompleteDeltas.length >= 3 ? average(allCompleteDeltas) : null;
  const historicalDeltas: number[] = [];

  return sortedDays.map((day) => {
    const bucket = dayMap.get(day)!;
    const morning = average(bucket.morning);
    const night = average(bucket.night);
    const rollingDelta =
      historicalDeltas.length >= 3 ? average(historicalDeltas.slice(-14)) : globalDelta;

    let mean: number | null = null;
    let estimated = false;

    if (morning !== null && night !== null) {
      mean = (morning + night) / 2;
      historicalDeltas.push(night - morning);
    } else if (morning !== null && rollingDelta !== null) {
      mean = morning + rollingDelta / 2;
      estimated = true;
    } else if (night !== null && rollingDelta !== null) {
      mean = night - rollingDelta / 2;
      estimated = true;
    }

    return {
      timestamp: day,
      morning,
      night,
      mean,
      estimated,
    };
  });
}

function getPregnancyTrendData(record_id: number, field: string): DataPoint[] {
  const metrics = getPregnancyDailyMetrics(record_id);

  return metrics
    .map((metric) => {
      if (field === PREGNANCY_MORNING_FIELD) {
        return metric.morning;
      }
      if (field === PREGNANCY_NIGHT_FIELD) {
        return metric.night;
      }
      return metric.mean;
    })
    .map((value, index) =>
      value !== null
        ? {
            timestamp: metrics[index].timestamp,
            value,
          }
        : null
    )
    .filter((item): item is DataPoint => item !== null);
}

function getFieldSeries(record_id: number, field: string): DataPoint[] {
  if (isPregnancyField(record_id, field)) {
    return getPregnancyTrendData(record_id, field);
  }
  return getGenericTrendData(record_id, field);
}

function groupSeriesByWeek(series: DataPoint[]): Array<{ week: string; avg: number }> {
  const weeklyMap = new Map<string, number[]>();

  for (const point of series) {
    const week = getWeekStart(point.timestamp);
    const bucket = weeklyMap.get(week) || [];
    bucket.push(point.value);
    weeklyMap.set(week, bucket);
  }

  return Array.from(weeklyMap.entries())
    .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
    .map(([week, values]) => ({
      week,
      avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    }));
}

function getWeeklyChangeSeries(record_id: number, field: string): DataPoint[] {
  const weeklySeries = groupSeriesByWeek(getFieldSeries(record_id, field));
  if (weeklySeries.length < 2) {
    return [];
  }

  const changes: DataPoint[] = [];
  for (let index = 1; index < weeklySeries.length; index += 1) {
    changes.push({
      timestamp: weeklySeries[index].week,
      value: weeklySeries[index].avg - weeklySeries[index - 1].avg,
    });
  }

  return changes;
}

function getMonthlyAverages(record_id: number, field: string): MonthlyData[] {
  const monthlyMap = new Map<string, number[]>();

  for (const point of getFieldSeries(record_id, field)) {
    const monthKey = point.timestamp.slice(0, 7);
    const bucket = monthlyMap.get(monthKey) || [];
    bucket.push(point.value);
    monthlyMap.set(monthKey, bucket);
  }

  return Array.from(monthlyMap.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([monthKey, values]) => {
      const [year, month] = monthKey.split('-').map(Number);
      return {
        year,
        month,
        avg_value: values.reduce((sum, value) => sum + value, 0) / values.length,
      };
    });
}

/**
 * 计算统计值
 */
export function calculateStats(record_id: number, field: string): {
  max: number | null;
  min: number | null;
  avg: number | null;
  sum: number | null;
  count: number;
  first: number | null;
  last: number | null;
} {
  const series = getFieldSeries(record_id, field);
  const numericValues = series.map((point) => point.value);

  if (numericValues.length === 0) {
    return {
      max: null,
      min: null,
      avg: null,
      sum: null,
      count: 0,
      first: null,
      last: null,
    };
  }

  const sorted = [...numericValues].sort((a, b) => a - b);
  const sum = numericValues.reduce((acc, value) => acc + value, 0);

  return {
    max: sorted[sorted.length - 1],
    min: sorted[0],
    avg: sum / numericValues.length,
    sum,
    count: numericValues.length,
    first: numericValues[0],
    last: numericValues[numericValues.length - 1],
  };
}

/**
 * 根据模板统计配置计算统计值
 */
export function calculateStat(record_id: number, statConfig: TemplateStat): number | null {
  const field = statConfig.field || 'weight';
  const stats = calculateStats(record_id, field);

  switch (statConfig.calc) {
    case 'max':
      return stats.max;
    case 'min':
      return stats.min;
    case 'avg':
      return stats.avg;
    case 'sum':
      return stats.sum;
    case 'last':
      return stats.last;
    case 'first':
      return stats.first;
    case 'last-first':
      if (stats.first !== null && stats.last !== null) {
        return stats.last - stats.first;
      }
      return null;
    case 'weekly_avg_change':
      return calculateWeeklyAvgChange(record_id, field);
    default:
      return null;
  }
}

/**
 * 计算周均变化率
 */
export function calculateWeeklyAvgChange(record_id: number, field: string): number | null {
  const weeklySeries = groupSeriesByWeek(getFieldSeries(record_id, field));
  if (weeklySeries.length < 2) {
    return null;
  }

  const changes: number[] = [];
  for (let index = 1; index < weeklySeries.length; index += 1) {
    changes.push(weeklySeries[index].avg - weeklySeries[index - 1].avg);
  }

  return average(changes);
}

/**
 * 获取趋势数据（按日聚合）
 */
export function getTrendData(record_id: number, field: string): DataPoint[] {
  return getFieldSeries(record_id, field);
}

/**
 * 获取图表数据
 */
export function getChartData(
  record_id: number,
  chartId: string,
  field: string,
  options: {
    title?: string;
    fields?: string[];
    aggregate?: 'daily' | 'weekly' | 'monthly';
    calc?: 'change' | 'avg' | 'sum';
  } = {}
): {
  chart_id: string;
  title: string;
  data: DataPoint[];
  series: ChartSeries[];
} {
  if (options.aggregate === 'weekly' && options.calc === 'change') {
    const weeklyChange = getWeeklyChangeSeries(record_id, field);
    return {
      chart_id: chartId,
      title: options.title || `${field} 周变化`,
      data: weeklyChange,
      series: [
        {
          field,
          data: weeklyChange,
        },
      ],
    };
  }

  const resolvedFields = options.fields && options.fields.length > 0 ? options.fields : [field];
  const series = resolvedFields.map((seriesField) => ({
    field: seriesField,
    data: getFieldSeries(record_id, seriesField),
  }));

  return {
    chart_id: chartId,
    title: options.title || `${field} 趋势`,
    data: series[0]?.data || [],
    series,
  };
}

/**
 * 获取当前年月
 */
function getCurrentYearMonth(): { year: number; month: number } {
  const now = dayjs();
  return { year: now.year(), month: now.month() + 1 };
}

/**
 * 月均同比（本月 vs 去年同月）
 */
export function getMonthlyComparison(record_id: number, field: string): {
  currentMonth: { year: number; month: number; avg_value: number } | null;
  lastYearSameMonth: { year: number; month: number; avg_value: number } | null;
  message: string;
} {
  const { year, month } = getCurrentYearMonth();
  const monthlyData = getMonthlyAverages(record_id, field);

  const currentMonthData = monthlyData.find((item) => item.year === year && item.month === month) || null;
  const lastYearSameMonthData =
    monthlyData.find((item) => item.year === year - 1 && item.month === month) || null;

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
export function getMonthlyPeriodComparison(record_id: number, field: string): {
  currentMonth: { avg_value: number } | null;
  lastMonth: { avg_value: number } | null;
  message: string;
} {
  const { year, month } = getCurrentYearMonth();
  const monthlyData = getMonthlyAverages(record_id, field);

  const currentMonthData = monthlyData.find((item) => item.year === year && item.month === month) || null;

  let lastYear = year;
  let lastMonth = month - 1;
  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear -= 1;
  }
  const lastMonthData = monthlyData.find((item) => item.year === lastYear && item.month === lastMonth) || null;

  if (!currentMonthData) {
    return {
      currentMonth: null,
      lastMonth: null,
      message: '数据不足',
    };
  }

  return {
    currentMonth: { avg_value: currentMonthData.avg_value },
    lastMonth: lastMonthData ? { avg_value: lastMonthData.avg_value } : null,
    message: lastMonthData ? '对比成功' : '数据不足（无上月数据）',
  };
}

/**
 * 周环比（本周 vs 上周）
 */
export function getWeeklyPeriodComparison(record_id: number, field: string): {
  currentWeek: { avg_value: number } | null;
  lastWeek: { avg_value: number } | null;
  message: string;
} {
  const series = getFieldSeries(record_id, field);
  const now = dayjs();
  const currentWeekStart = getWeekStart(now.format('YYYY-MM-DD'));
  const currentWeekEnd = dayjs(currentWeekStart).add(6, 'day').format('YYYY-MM-DD');
  const lastWeekStart = dayjs(currentWeekStart).subtract(7, 'day').format('YYYY-MM-DD');
  const lastWeekEnd = dayjs(currentWeekStart).subtract(1, 'day').format('YYYY-MM-DD');

  const getWeekAverage = (start: string, end: string): number | null => {
    const values = series
      .filter((point) => point.timestamp >= start && point.timestamp <= end)
      .map((point) => point.value);
    return average(values);
  };

  const currentWeekAvg = getWeekAverage(currentWeekStart, currentWeekEnd);
  const lastWeekAvg = getWeekAverage(lastWeekStart, lastWeekEnd);

  if (currentWeekAvg === null) {
    return {
      currentWeek: null,
      lastWeek: null,
      message: '数据不足',
    };
  }

  return {
    currentWeek: { avg_value: currentWeekAvg },
    lastWeek: lastWeekAvg !== null ? { avg_value: lastWeekAvg } : null,
    message: lastWeekAvg !== null ? '对比成功' : '数据不足（无上周数据）',
  };
}

/**
 * 获取完整分析数据
 */
export function getFullAnalysis(record_id: number, field: string = 'weight') {
  return {
    trend: getTrendData(record_id, field),
    stats: calculateStats(record_id, field),
    monthlyComparison: getMonthlyComparison(record_id, field),
    monthlyPeriodComparison: getMonthlyPeriodComparison(record_id, field),
    weeklyPeriodComparison: getWeeklyPeriodComparison(record_id, field),
  };
}

/**
 * 获取指定字段的日级指标（供模板化页面使用）
 */
export function getPregnancyMetricDetails(record_id: number): PregnancyDayMetric[] {
  if (getRecordTemplateId(record_id) !== PREGNANCY_TEMPLATE_ID) {
    return [];
  }
  return getPregnancyDailyMetrics(record_id);
}
