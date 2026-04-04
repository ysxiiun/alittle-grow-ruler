/**
 * 数据记录 API 路由
 * 重构：支持新的数据结构和导入导出功能
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as dataEntriesDao from '../database/dataEntries';
import * as recordsDao from '../database/records';
import * as XLSX from 'xlsx';
import { getTemplateById } from '../templates';
import {
  buildExportRows,
  buildImportTemplateRows,
  enrichTemplate,
  parseImportedRows,
} from '../templates/io';
import type { Template } from '../database/templates';

const router = Router();

function validateEntryValues(template: Template, values: Record<string, unknown>): string | null {
  for (const field of template.fields) {
    const value = values[field.key];
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label}不能为空`;
    }

    if (
      field.type === 'select' &&
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !field.options?.some((option) => option.value === value)
    ) {
      return `${field.label}无效`;
    }
  }

  return null;
}

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

function sendWorkbook(
  res: Response,
  rows: Array<Record<string, string | number>>,
  filename: string,
  format: 'xlsx' | 'csv',
  sheetName: string
): void {
  if (format === 'csv') {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const encodedFilename = encodeURIComponent(`${filename}.csv`);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send('\ufeff' + csvContent);
    return;
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const encodedFilename = encodeURIComponent(`${filename}.xlsx`);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
  res.send(buffer);
}

/**
 * GET /api/records
 * 获取数据列表（支持分页）
 * 查询参数：record_id, page, pageSize
 * 兼容旧 API
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { record_id, ruler_id, page, pageSize, start_date, end_date } = req.query;
    const recordId = record_id || ruler_id;

    if (!recordId) {
      return res.status(400).json({ success: false, message: '缺少 record_id 参数' });
    }

    const result = dataEntriesDao.findAll({
      record_id: parseInt(recordId as string),
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ success: false, message: '获取记录失败' });
  }
});

/**
 * GET /api/records/:id
 * 获取单条数据详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const entry = dataEntriesDao.findById(id);
    if (!entry) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ success: false, message: '获取记录失败' });
  }
});

/**
 * POST /api/records
 * 创建数据记录
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { record_id, ruler_id, timestamp, values, note } = req.body;
    const recordId = record_id || ruler_id;

    if (!recordId || !timestamp) {
      return res.status(400).json({ success: false, message: 'record_id 和 timestamp 不能为空' });
    }

    // 检查记录集存在
    const record = recordsDao.findById(parseInt(recordId as string));
    if (!record) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    const template = getTemplateById(record.template_id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    const validationError = validateEntryValues(template, values || {});
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const entry = dataEntriesDao.create({
      record_id: parseInt(recordId as string),
      timestamp,
      values: values || {},
      note,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ success: false, message: '创建记录失败' });
  }
});

/**
 * PUT /api/records/:id
 * 更新数据记录
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }

    const { timestamp, values, note } = req.body;
    const existing = dataEntriesDao.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    const record = recordsDao.findById(existing.record_id);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录集不存在' });
    }

    const template = getTemplateById(record.template_id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    const mergedValues = values !== undefined
      ? { ...existing.values, ...(values as Record<string, unknown>) }
      : existing.values;
    const validationError = validateEntryValues(template, mergedValues);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const updated = dataEntriesDao.update(id, { timestamp, values, note });

    if (!updated) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ success: false, message: '更新记录失败' });
  }
});

/**
 * DELETE /api/records/:id
 * 删除数据记录
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const deleted = dataEntriesDao.remove(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ success: false, message: '删除记录失败' });
  }
});

/**
 * POST /api/records/import
 * 导入数据记录（Excel/CSV）
 * 只导入模板定义的字段，忽略其他数据
 */
router.post('/import', upload.single('file'), (req: Request, res: Response) => {
  try {
    const { record_id, ruler_id } = req.body;
    const recordId = record_id || ruler_id;

    if (!recordId) {
      return res.status(400).json({ success: false, message: '缺少 record_id 参数' });
    }

    // 检查记录集存在
    const record = recordsDao.findById(parseInt(recordId as string));
    if (!record) {
      return res.status(404).json({ success: false, message: '记录尺不存在' });
    }

    // 获取模板信息
    const template = getTemplateById(record.template_id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }

    // 解析 Excel/CSV 文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: '',
    }) as Array<Record<string, unknown>>;
    const importResult = parseImportedRows(
      enrichTemplate(template),
      rows,
      parseInt(recordId as string)
    );

    const count = dataEntriesDao.createBatch(importResult.entries);
    const suffix = importResult.skipped > 0 ? `，跳过 ${importResult.skipped} 条` : '';
    res.json({
      success: true,
      message: `成功导入 ${count} 条记录${suffix}`,
      data: {
        count,
        skipped: importResult.skipped,
        errors: importResult.errors,
      },
    });
  } catch (error) {
    console.error('Error importing records:', error);
    res.status(500).json({ success: false, message: '导入失败：' + (error as Error).message });
  }
});

/**
 * GET /api/records/import/template
 * 下载导入模板（支持 Excel 和 CSV 格式）
 * 必须传入 ruler_id 参数，根据记录尺的模板生成对应字段
 */
router.get('/import/template', (req: Request, res: Response) => {
  try {
    const { ruler_id, format } = req.query;

    if (!ruler_id) {
      return res.status(400).json({ success: false, message: '缺少 ruler_id 参数' });
    }

    const record = recordsDao.findById(parseInt(ruler_id as string));
    if (!record) {
      return res.status(404).json({ success: false, message: '记录尺不存在' });
    }

    const template = getTemplateById(record.template_id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    const rows = buildImportTemplateRows(template);
    const normalizedFormat = format === 'csv' ? 'csv' : 'xlsx';
    sendWorkbook(res, rows, `${record.name}_导入模板`, normalizedFormat, '导入模板');
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: '生成模板失败' });
  }
});

/**
 * GET /api/records/export/:recordId
 * 导出数据（只导出模板定义的字段）
 */
router.get('/export/:recordId', (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    if (isNaN(recordId)) {
      return res.status(400).json({ success: false, message: '无效的 recordId' });
    }

    const record = recordsDao.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录尺不存在' });
    }

    const template = getTemplateById(record.template_id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    // 获取所有数据
    const result = dataEntriesDao.findAll({
      record_id: recordId,
      page: 1,
      pageSize: 10000,
    });

    const rows = buildExportRows(template, result.entries);
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    sendWorkbook(res, rows, `${record.name}_数据导出`, format, '数据');
  } catch (error) {
    console.error('Error exporting records:', error);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

export default router;
