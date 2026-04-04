/**
 * 数据库连接管理模块
 * 使用 better-sqlite3 作为 SQLite 数据库驱动
 */

import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

/**
 * 获取数据库实例
 * @param dbPath 数据库文件路径，默认为 data/grow-ruler.db
 */
export function getDatabase(dbPath?: string): Database.Database {
  if (db) {
    return db;
  }

  const databasePath = dbPath || path.resolve(process.cwd(), 'data', 'grow-ruler.db');

  // 确保数据库目录存在
  const fs = require('fs');
  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');

  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 初始化数据库 schema
 */
export function initializeDatabase(): void {
  const database = getDatabase();

  // 创建模板表
  database.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      fields TEXT,
      charts TEXT,
      stats TEXT,
      import_config TEXT,
      export_config TEXT,
      is_builtin INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建记录集表（重构自 record_rulers）
  database.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      subject TEXT,
      color TEXT DEFAULT '#10B981',
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )
  `);

  // 创建数据条目表（重构自 records）
  database.exec(`
    CREATE TABLE IF NOT EXISTS data_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      timestamp DATETIME NOT NULL,
      "values" TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_template_id ON records(template_id);
    CREATE INDEX IF NOT EXISTS idx_records_is_deleted ON records(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_data_entries_record_id ON data_entries(record_id);
    CREATE INDEX IF NOT EXISTS idx_data_entries_timestamp ON data_entries(timestamp);
  `);

  const templateColumns = database
    .prepare('PRAGMA table_info(templates)')
    .all() as Array<{ name: string }>;
  const templateColumnNames = new Set(templateColumns.map((column) => column.name));

  if (!templateColumnNames.has('import_config')) {
    database.exec('ALTER TABLE templates ADD COLUMN import_config TEXT');
  }
  if (!templateColumnNames.has('export_config')) {
    database.exec('ALTER TABLE templates ADD COLUMN export_config TEXT');
  }

  // 兼容旧表（如果存在旧数据）
  database.exec(`
    CREATE TABLE IF NOT EXISTS record_rulers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      template_type TEXT NOT NULL DEFAULT 'height_weight',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 兼容旧 records 表
  database.exec(`
    CREATE TABLE IF NOT EXISTS old_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ruler_id INTEGER NOT NULL,
      record_date DATE NOT NULL,
      height REAL,
      weight REAL,
      weight_unit TEXT DEFAULT 'kg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ruler_id) REFERENCES record_rulers(id) ON DELETE CASCADE
    )
  `);
}
