/**
 * 血压记录模板
 */

import type { Template } from '../database/templates';

export const bloodPressureTemplate: Template = {
  id: 'blood-pressure',
  name: '血压记录',
  description: '记录血压变化，监测健康状况',
  icon: '🩺',
  fields: [
    {
      key: 'morning',
      label: '早晨血压',
      type: 'number',
      unit: 'mmHg',
      precision: 1,
      required: false,
      placeholder: '请输入早晨收缩压',
    },
    {
      key: 'evening',
      label: '晚上血压',
      type: 'number',
      unit: 'mmHg',
      precision: 1,
      required: false,
      placeholder: '请输入晚上收缩压',
    },
  ],
  charts: [
    {
      id: 'morning-trend',
      type: 'line',
      title: '早晨血压趋势',
      field: 'morning',
      description: '展示早晨血压随时间的变化趋势',
    },
    {
      id: 'evening-trend',
      type: 'line',
      title: '晚上血压趋势',
      field: 'evening',
      description: '展示晚上血压随时间的变化趋势',
    },
    {
      id: 'combined-trend',
      type: 'line',
      title: '血压对比',
      fields: ['morning', 'evening'],
      description: '早晚血压对比趋势',
    },
  ],
  stats: [
    {
      id: 'morning-max',
      label: '早晨最高',
      calc: 'max',
      field: 'morning',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'morning-min',
      label: '早晨最低',
      calc: 'min',
      field: 'morning',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'morning-avg',
      label: '早晨平均',
      calc: 'avg',
      field: 'morning',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'evening-max',
      label: '晚上最高',
      calc: 'max',
      field: 'evening',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'evening-min',
      label: '晚上最低',
      calc: 'min',
      field: 'evening',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'evening-avg',
      label: '晚上平均',
      calc: 'avg',
      field: 'evening',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'current-morning',
      label: '当前早晨',
      calc: 'last',
      field: 'morning',
      unit: 'mmHg',
      precision: 1,
    },
    {
      id: 'current-evening',
      label: '当前晚上',
      calc: 'last',
      field: 'evening',
      unit: 'mmHg',
      precision: 1,
    },
  ],
  is_builtin: true,
};