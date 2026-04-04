/**
 * 身高体重记录模板
 */

import type { Template } from '../database/templates';

export const heightWeightTemplate: Template = {
  id: 'height-weight',
  name: '身高体重记录',
  description: '记录身高体重变化，分析成长趋势，帮助科学管理健康',
  icon: '📏',
  fields: [
    {
      key: 'height',
      label: '身高',
      type: 'number',
      unit: 'cm',
      precision: 1,
      required: false,
      placeholder: '请输入身高',
    },
    {
      key: 'weight',
      label: '体重',
      type: 'number',
      unit: 'kg',
      precision: 1,
      required: true,
      placeholder: '请输入体重',
    },
  ],
  charts: [
    {
      id: 'height-trend',
      type: 'line',
      title: '身高趋势',
      field: 'height',
      description: '展示身高随时间的变化趋势',
    },
    {
      id: 'weight-trend',
      type: 'line',
      title: '体重趋势',
      field: 'weight',
      description: '展示体重随时间的变化趋势',
    },
    {
      id: 'weekly-change',
      type: 'bar',
      title: '周均环比',
      field: 'weight',
      aggregate: 'weekly',
      calc: 'change',
      description: '每周平均体重变化',
    },
  ],
  stats: [
    {
      id: 'height-max',
      label: '最高身高',
      calc: 'max',
      field: 'height',
      unit: 'cm',
      precision: 1,
    },
    {
      id: 'height-current',
      label: '当前身高',
      calc: 'last',
      field: 'height',
      unit: 'cm',
      precision: 1,
    },
    {
      id: 'weight-max',
      label: '最高体重',
      calc: 'max',
      field: 'weight',
      unit: 'kg',
      precision: 1,
    },
    {
      id: 'weight-min',
      label: '最低体重',
      calc: 'min',
      field: 'weight',
      unit: 'kg',
      precision: 1,
    },
    {
      id: 'weight-avg',
      label: '平均体重',
      calc: 'avg',
      field: 'weight',
      unit: 'kg',
      precision: 1,
    },
    {
      id: 'weight-change',
      label: '体重变化',
      calc: 'last-first',
      field: 'weight',
      unit: 'kg',
      precision: 1,
    },
    {
      id: 'weekly-avg-change',
      label: '周均变化',
      calc: 'weekly_avg_change',
      field: 'weight',
      unit: 'kg/周',
      precision: 2,
    },
  ],
  is_builtin: true,
};
