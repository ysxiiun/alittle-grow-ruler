/**
 * 模板数据访问层
 */

import { getDatabase } from './index';

export interface TemplateField {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'select';
  unit?: string;
  precision?: number;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface TemplateChart {
  id: string;
  type: 'line' | 'bar' | 'pie';
  title: string;
  field?: string;
  fields?: string[];
  description?: string;
  aggregate?: 'daily' | 'weekly' | 'monthly';
  calc?: 'change' | 'avg' | 'sum';
}

export interface TemplateStat {
  id: string;
  label: string;
  calc: 'max' | 'min' | 'avg' | 'sum' | 'last' | 'first' | 'last-first' | 'weekly_avg_change';
  unit?: string;
  precision?: number;
  field?: string;
}

export interface TemplateIOColumn {
  key: string;
  label: string;
  source: 'timestamp' | 'note' | 'field';
  fieldKey?: string;
  aliases?: string[];
  example?: string | number;
}

export interface TemplateImportConfig {
  columns: TemplateIOColumn[];
}

export interface TemplateExportConfig {
  columns: TemplateIOColumn[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  fields: TemplateField[];
  charts: TemplateChart[];
  stats: TemplateStat[];
  import_config?: TemplateImportConfig;
  export_config?: TemplateExportConfig;
  is_builtin: boolean;
  created_at?: string;
}

function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeTemplate(row: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  fields: string;
  charts: string;
  stats: string;
  import_config: string | null;
  export_config: string | null;
  is_builtin: number;
  created_at: string;
}): Template {
  const template: Template = {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    fields: parseJSON(row.fields, []),
    charts: parseJSON(row.charts, []),
    stats: parseJSON(row.stats, []),
    import_config: parseJSON(row.import_config, undefined),
    export_config: parseJSON(row.export_config, undefined),
    is_builtin: row.is_builtin === 1,
    created_at: row.created_at,
  };

  return template;
}

/**
 * 获取所有模板
 */
export function findAll(): Template[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM templates ORDER BY name');
  const rows = stmt.all() as Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    fields: string;
    charts: string;
    stats: string;
    import_config: string | null;
    export_config: string | null;
    is_builtin: number;
    created_at: string;
  }>;

  return rows.map((row) => normalizeTemplate(row));
}

/**
 * 根据 ID 查找模板
 */
export function findById(id: string): Template | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
  const row = stmt.get(id) as {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    fields: string;
    charts: string;
    stats: string;
    import_config: string | null;
    export_config: string | null;
    is_builtin: number;
    created_at: string;
  } | undefined;

  if (!row) return undefined;

  return normalizeTemplate(row);
}

/**
 * 创建模板
 */
export function create(template: Template): Template {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO templates (id, name, description, icon, fields, charts, stats, import_config, export_config, is_builtin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    template.id,
    template.name,
    template.description || null,
    template.icon || null,
    JSON.stringify(template.fields),
    JSON.stringify(template.charts),
    JSON.stringify(template.stats),
    JSON.stringify(template.import_config || null),
    JSON.stringify(template.export_config || null),
    template.is_builtin ? 1 : 0
  );
  return template;
}

/**
 * 创建或更新模板
 */
export function upsert(template: Template): Template {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO templates (id, name, description, icon, fields, charts, stats, import_config, export_config, is_builtin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      fields = excluded.fields,
      charts = excluded.charts,
      stats = excluded.stats,
      import_config = excluded.import_config,
      export_config = excluded.export_config,
      is_builtin = excluded.is_builtin
  `);

  stmt.run(
    template.id,
    template.name,
    template.description || null,
    template.icon || null,
    JSON.stringify(template.fields),
    JSON.stringify(template.charts),
    JSON.stringify(template.stats),
    JSON.stringify(template.import_config || null),
    JSON.stringify(template.export_config || null),
    template.is_builtin ? 1 : 0
  );

  return template;
}

/**
 * 删除模板
 */
export function remove(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND is_builtin = 0');
  const result = stmt.run(id);
  return result.changes > 0;
}
