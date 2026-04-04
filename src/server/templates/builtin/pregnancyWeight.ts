/**
 * 孕期体重记录模板
 */

import type { Template } from '../database/templates';

export const pregnancyWeightTemplate: Template = {
  id: 'pregnancy-weight',
  name: '孕期体重记录',
  description: '记录孕期体重变化，分析增长趋势，帮助科学管理孕期健康',
  icon: '🤰',
  fields: [
    {
      key: 'weight',
      label: '体重',
      type: 'number',
      unit: '斤',
      precision: 1,
      required: true,
      placeholder: '请输入体重',
    },
    {
      key: 'weight_period',
      label: '体重类型',
      type: 'select',
      required: true,
      placeholder: '请选择体重类型',
      options: [
        { value: 'morning', label: '晨起' },
        { value: 'night', label: '睡前' },
      ],
    },
  ],
  charts: [
    {
      id: 'trend',
      type: 'line',
      title: '体重趋势',
      fields: ['weight_morning', 'weight_night'],
      description: '展示晨起体重与睡前体重的双线趋势',
    },
    {
      id: 'weekly-change',
      type: 'bar',
      title: '周均增长变化',
      field: 'weight_mean',
      aggregate: 'weekly',
      calc: 'change',
      description: '展示相邻有效周之间的日均体重变化值',
    },
  ],
  stats: [
    {
      id: 'total-change',
      label: '总增长',
      calc: 'last-first',
      field: 'weight_mean',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'weekly-avg',
      label: '周均增长',
      calc: 'weekly_avg_change',
      field: 'weight_mean',
      unit: '斤/周',
      precision: 2,
    },
    {
      id: 'max',
      label: '最高日均',
      calc: 'max',
      field: 'weight_mean',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'min',
      label: '最低日均',
      calc: 'min',
      field: 'weight_mean',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'avg',
      label: '平均日均',
      calc: 'avg',
      field: 'weight_mean',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'morning-avg',
      label: '晨起均值',
      calc: 'avg',
      field: 'weight_morning',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'night-avg',
      label: '睡前均值',
      calc: 'avg',
      field: 'weight_night',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'morning-current',
      label: '最新晨起',
      calc: 'last',
      field: 'weight_morning',
      unit: '斤',
      precision: 1,
    },
    {
      id: 'night-current',
      label: '最新睡前',
      calc: 'last',
      field: 'weight_night',
      unit: '斤',
      precision: 1,
    },
  ],
  is_builtin: true,
};
