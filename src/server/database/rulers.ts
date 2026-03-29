/**
 * 记录尺（Record Rulers）数据访问层
 */

import { getDatabase } from './index';

export interface RecordRuler {
  id?: number;
  name: string;
  description?: string;
  template_type: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 获取所有记录尺
 */
export function findAll(options?: { search?: string; template_type?: string }): RecordRuler[] {
  const db = getDatabase();
  let query = 'SELECT * FROM record_rulers WHERE 1=1';
  const params: (string)[] = [];

  if (options?.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  if (options?.template_type) {
    query += ' AND template_type = ?';
    params.push(options.template_type);
  }

  query += ' ORDER BY updated_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params) as RecordRuler[];
}

/**
 * 根据 ID 查找记录尺
 */
export function findById(id: number): RecordRuler | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM record_rulers WHERE id = ?');
  return stmt.get(id) as RecordRuler | undefined;
}

/**
 * 创建记录尺
 */
export function create(ruler: RecordRuler): RecordRuler {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO record_rulers (name, description, template_type)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(ruler.name, ruler.description || null, ruler.template_type);
  return { ...ruler, id: result.lastInsertRowid as number };
}

/**
 * 更新记录尺
 */
export function update(id: number, ruler: Partial<RecordRuler>): RecordRuler | undefined {
  const db = getDatabase();
  const existing = findById(id);
  if (!existing) {
    return undefined;
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (ruler.name !== undefined) {
    fields.push('name = ?');
    values.push(ruler.name);
  }
  if (ruler.description !== undefined) {
    fields.push('description = ?');
    values.push(ruler.description);
  }
  if (ruler.template_type !== undefined) {
    fields.push('template_type = ?');
    values.push(ruler.template_type);
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(String(id));

  const stmt = db.prepare(`
    UPDATE record_rulers SET ${fields.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);

  return findById(id);
}

/**
 * 删除记录尺
 */
export function remove(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM record_rulers WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
