/**
 * 记录数据（Records）数据访问层
 */

import { getDatabase } from './index';

export interface Record {
  id?: number;
  ruler_id: number;
  record_date: string;
  height?: number | null;
  weight?: number | null;
  weight_unit?: string;
  created_at?: string;
}

/**
 * 获取记录列表（支持分页）
 */
export function findAll(options: {
  ruler_id: number;
  page?: number;
  pageSize?: number;
}): { records: Record[]; total: number } {
  const db = getDatabase();
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // 获取总数
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM records WHERE ruler_id = ?');
  const { count } = countStmt.get(options.ruler_id) as { count: number };

  // 获取分页数据
  const dataStmt = db.prepare(`
    SELECT * FROM records
    WHERE ruler_id = ?
    ORDER BY record_date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `);
  const records = dataStmt.all(options.ruler_id, pageSize, offset) as Record[];

  return { records, total: count };
}

/**
 * 根据 ID 查找记录
 */
export function findById(id: number): Record | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
  return stmt.get(id) as Record | undefined;
}

/**
 * 创建记录
 */
export function create(record: Record): Record {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO records (ruler_id, record_date, height, weight, weight_unit)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    record.ruler_id,
    record.record_date,
    record.height ?? null,
    record.weight ?? null,
    record.weight_unit || 'kg'
  );
  return { ...record, id: result.lastInsertRowid as number };
}

/**
 * 更新记录
 */
export function update(id: number, record: Partial<Record>): Record | undefined {
  const db = getDatabase();
  const existing = findById(id);
  if (!existing) {
    return undefined;
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (record.record_date !== undefined) {
    fields.push('record_date = ?');
    values.push(record.record_date);
  }
  if (record.height !== undefined) {
    fields.push('height = ?');
    values.push(record.height);
  }
  if (record.weight !== undefined) {
    fields.push('weight = ?');
    values.push(record.weight);
  }
  if (record.weight_unit !== undefined) {
    fields.push('weight_unit = ?');
    values.push(record.weight_unit);
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE records SET ${fields.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);

  return findById(id);
}

/**
 * 删除记录
 */
export function remove(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM records WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 批量创建记录（用于导入）
 */
export function createBatch(records: Record[]): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO records (ruler_id, record_date, height, weight, weight_unit)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: Record[]) => {
    for (const item of items) {
      stmt.run(item.ruler_id, item.record_date, item.height ?? null, item.weight ?? null, item.weight_unit || 'kg');
    }
  });

  insertMany(records);
  return records.length;
}
