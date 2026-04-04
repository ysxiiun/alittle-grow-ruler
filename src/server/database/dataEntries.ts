/**
 * 数据条目（Data Entries）数据访问层
 * 存储动态 JSON 数据，支持模板系统
 */

import { getDatabase } from './index';

export interface DataEntry {
  id?: number;
  record_id: number;
  timestamp: string;
  values: Record<string, number | string | null>;
  note?: string | null;
  created_at?: string;
}

/**
 * 获取数据条目列表（支持分页和时间范围筛选）
 */
export function findAll(options: {
  record_id: number;
  page?: number;
  pageSize?: number;
  start_date?: string;
  end_date?: string;
}): { entries: DataEntry[]; total: number } {
  const db = getDatabase();
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let countQuery = 'SELECT COUNT(*) as count FROM data_entries WHERE record_id = ?';
  let dataQuery = `
    SELECT * FROM data_entries
    WHERE record_id = ?
  `;
  const params: (number | string)[] = [options.record_id];
  const countParams: (number | string)[] = [options.record_id];

  if (options.start_date) {
    countQuery += ' AND timestamp >= ?';
    dataQuery += ' AND timestamp >= ?';
    params.push(options.start_date);
    countParams.push(options.start_date);
  }

  if (options.end_date) {
    countQuery += ' AND timestamp <= ?';
    dataQuery += ' AND timestamp <= ?';
    params.push(options.end_date);
    countParams.push(options.end_date);
  }

  // 获取总数
  const countStmt = db.prepare(countQuery);
  const { count } = countStmt.get(...countParams) as { count: number };

  // 获取分页数据
  dataQuery += ' ORDER BY timestamp DESC, created_at DESC LIMIT ? OFFSET ?';
  const dataStmt = db.prepare(dataQuery);
  const rows = dataStmt.all(...params, pageSize, offset) as Array<{
    id: number;
    record_id: number;
    timestamp: string;
    values: string;
    note: string | null;
    created_at: string;
  }>;

  const entries = rows.map(row => ({
    id: row.id,
    record_id: row.record_id,
    timestamp: row.timestamp,
    values: JSON.parse(row.values || '{}'),
    note: row.note,
    created_at: row.created_at,
  }));

  return { entries, total: count };
}

/**
 * 根据 ID 查找数据条目
 */
export function findById(id: number): DataEntry | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM data_entries WHERE id = ?');
  const row = stmt.get(id) as {
    id: number;
    record_id: number;
    timestamp: string;
    values: string;
    note: string | null;
    created_at: string;
  } | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    record_id: row.record_id,
    timestamp: row.timestamp,
    values: JSON.parse(row.values || '{}'),
    note: row.note,
    created_at: row.created_at,
  };
}

/**
 * 创建数据条目
 */
export function create(entry: DataEntry): DataEntry {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO data_entries (record_id, timestamp, "values", note)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    entry.record_id,
    entry.timestamp,
    JSON.stringify(entry.values),
    entry.note || null
  );

  // 更新记录集的 updated_at
  const updateStmt = db.prepare(`
    UPDATE records SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  updateStmt.run(entry.record_id);

  return { ...entry, id: result.lastInsertRowid as number };
}

/**
 * 更新数据条目
 */
export function update(id: number, entry: Partial<DataEntry>): DataEntry | undefined {
  const db = getDatabase();
  const existing = findById(id);
  if (!existing) {
    return undefined;
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (entry.timestamp !== undefined) {
    fields.push('timestamp = ?');
    values.push(entry.timestamp);
  }
  if (entry.values !== undefined) {
    fields.push('"values" = ?');
    values.push(JSON.stringify(entry.values));
  }
  if (entry.note !== undefined) {
    fields.push('note = ?');
    values.push(entry.note);
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE data_entries SET ${fields.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);

  // 更新记录集的 updated_at
  const updateStmt = db.prepare(`
    UPDATE records SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  updateStmt.run(existing.record_id);

  return findById(id);
}

/**
 * 删除数据条目
 */
export function remove(id: number): boolean {
  const db = getDatabase();
  const entry = findById(id);
  if (!entry) return false;

  const stmt = db.prepare('DELETE FROM data_entries WHERE id = ?');
  const result = stmt.run(id);

  // 更新记录集的 updated_at
  const updateStmt = db.prepare(`
    UPDATE records SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  updateStmt.run(entry.record_id);

  return result.changes > 0;
}

/**
 * 批量创建数据条目（用于导入）
 */
export function createBatch(entries: DataEntry[]): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO data_entries (record_id, timestamp, "values", note)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: DataEntry[]) => {
    for (const item of items) {
      stmt.run(
        item.record_id,
        item.timestamp,
        JSON.stringify(item.values),
        item.note || null
      );
    }
  });

  insertMany(entries);

  // 更新记录集的 updated_at
  if (entries.length > 0) {
    const updateStmt = db.prepare(`
      UPDATE records SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    updateStmt.run(entries[0].record_id);
  }

  return entries.length;
}

/**
 * 获取指定字段的所有值（用于统计分析）
 */
export function getFieldValues(record_id: number, field: string): Array<{ timestamp: string; value: number | null }> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT timestamp, "values" FROM data_entries
    WHERE record_id = ?
    ORDER BY timestamp ASC
  `);
  const rows = stmt.all(record_id) as Array<{
    timestamp: string;
    values: string;
  }>;

  return rows.map(row => {
    const values = JSON.parse(row.values || '{}');
    return {
      timestamp: row.timestamp,
      value: values[field] !== undefined ? (values[field] as number) : null,
    };
  }).filter(item => item.value !== null);
}
