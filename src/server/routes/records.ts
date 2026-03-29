/**
 * 记录数据 API 路由
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as recordsDao from '../database/records';
import * as XLSX from 'xlsx';

const router = Router();

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * GET /api/records
 * 获取记录列表（支持分页）
 * 查询参数：ruler_id, page, pageSize
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { ruler_id, page, pageSize } = req.query;
    if (!ruler_id) {
      return res.status(400).json({ success: false, message: '缺少 ruler_id 参数' });
    }
    const result = recordsDao.findAll({
      ruler_id: parseInt(ruler_id as string),
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ success: false, message: '获取记录失败' });
  }
});

/**
 * GET /api/records/:id
 * 获取单条记录详情
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const record = recordsDao.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: '记录不存在' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ success: false, message: '获取记录失败' });
  }
});

/**
 * POST /api/records
 * 创建记录
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { ruler_id, record_date, height, weight, weight_unit } = req.body;
    if (!ruler_id || !record_date) {
      return res.status(400).json({ success: false, message: 'ruler_id 和 record_date 不能为空' });
    }
    const record = recordsDao.create({
      ruler_id: parseInt(ruler_id),
      record_date,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      weight_unit: weight_unit || 'kg',
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ success: false, message: '创建记录失败' });
  }
});

/**
 * PUT /api/records/:id
 * 更新记录
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const { record_date, height, weight, weight_unit } = req.body;
    const updated = recordsDao.update(id, {
      record_date,
      height: height !== undefined ? parseFloat(height) : undefined,
      weight: weight !== undefined ? parseFloat(weight) : undefined,
      weight_unit,
    });
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
 * 删除记录
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: '无效的 ID' });
    }
    const deleted = recordsDao.remove(id);
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
 * 导入记录数据（Excel/CSV）
 */
router.post('/import', upload.single('file'), (req: Request, res: Response) => {
  try {
    const { ruler_id } = req.body;
    if (!ruler_id) {
      return res.status(400).json({ success: false, message: '缺少 ruler_id 参数' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }

    // 解析 Excel/CSV 文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Array<{
      record_date: string;
      height?: number;
      weight?: number;
      weight_unit?: string;
    }>;

    // 转换数据格式
    const records: recordsDao.Record[] = data.map(row => ({
      ruler_id: parseInt(ruler_id),
      record_date: row.record_date,
      height: row.height || null,
      weight: row.weight || null,
      weight_unit: row.weight_unit || 'kg',
    }));

    // 批量插入
    const count = recordsDao.createBatch(records);
    res.json({ success: true, message: `成功导入 ${count} 条记录`, data: { count } });
  } catch (error) {
    console.error('Error importing records:', error);
    res.status(500).json({ success: false, message: '导入失败：' + (error as Error).message });
  }
});

/**
 * GET /api/records/import/template
 * 下载导入模板
 */
router.get('/import/template', (_req: Request, res: Response) => {
  try {
    const workbook = XLSX.utils.book_new();
    const data = [
      ['record_date', 'height', 'weight', 'weight_unit'],
      ['2024-01-01', 170.5, 65, 'kg'],
      ['2024-01-15', 171.0, 64.5, 'kg'],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, '模板');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=记录模板.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: '生成模板失败' });
  }
});

export default router;
