/**
 * 记录集（Records）数据访问层
 * 重构：从原来的 ruler_id 改为 template_id，支持模板系统
 */

import { getDatabase } from './index';

export interface RecordSet {
  id?: number;
  template_id: string;
  name: string;
  description?: string;
  subject?: string;
  color?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * 获取所有记录集（排除已删除）
 */
export function findAll(options?: {
  search?: string;
  template_id?: string;
  include_deleted?: boolean;
}): RecordSet[] {
  const db = getDatabase();
  let query = 'SELECT * FROM records WHERE 1=1';
  const params: (string)[] = [];

  if (!options?.include_deleted) {
    query += ' AND is_deleted = 0';
  }

  if (options?.search) {
    query += ' AND (name LIKE ? OR description LIKE ? OR subject LIKE ?)';
    params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
  }

  if (options?.template_id) {
    query += ' AND template_id = ?';
    params.push(options.template_id);
  }

  query += ' ORDER BY updated_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params) as RecordSet[];
}

/**
 * 根据 ID 查找记录集
 */
export function findById(id: number, include_deleted?: boolean): RecordSet | undefined {
  const db = getDatabase();
  const query = include_deleted
    ? 'SELECT * FROM records WHERE id = ?'
    : 'SELECT * FROM records WHERE id = ? AND is_deleted = 0';
  const stmt = db.prepare(query);
  return stmt.get(id) as RecordSet | undefined;
}

/**
 * 创建记录集
 */
export function create(record: RecordSet): RecordSet {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO records (template_id, name, description, subject, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    record.template_id,
    record.name,
    record.description || null,
    record.subject || null,
    record.color || '#10B981'
  );
  return { ...record, id: result.lastInsertRowid as number };
}

/**
 * 更新记录集
 */
export function update(id: number, record: Partial<RecordSet>): RecordSet | undefined {
  const db = getDatabase();
  const existing = findById(id, true);
  if (!existing) {
    return undefined;
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (record.name !== undefined) {
    fields.push('name = ?');
    values.push(record.name);
  }
  if (record.description !== undefined) {
    fields.push('description = ?');
    values.push(record.description);
  }
  if (record.subject !== undefined) {
    fields.push('subject = ?');
    values.push(record.subject);
  }
  if (record.color !== undefined) {
    fields.push('color = ?');
    values.push(record.color);
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(String(id));

  const stmt = db.prepare(`
    UPDATE records SET ${fields.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);

  return findById(id);
}

/**
 * 软删除记录集
 */
export function softDelete(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 恢复记录集
 */
export function restore(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE records SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 真删除记录集
 */
export function remove(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM records WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * 获取记录集统计（记录数量等）
 */
export function getStats(id: number): { count: number; last_time?: string } {
  const db = getDatabase();

  // 获取数据条目数量
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM data_entries WHERE record_id = ?');
  const { count } = countStmt.get(id) as { count: number };

  // 获取最后记录时间
  const lastStmt = db.prepare(`
    SELECT MAX(timestamp) as last_time FROM data_entries WHERE record_id = ?
  `);
  const { last_time } = lastStmt.get(id) as { last_time: string | null };

  return { count, last_time: last_time || undefined };
}