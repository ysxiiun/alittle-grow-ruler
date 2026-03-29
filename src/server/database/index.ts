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

  // 创建记录尺表
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

  // 创建记录数据表
  database.exec(`
    CREATE TABLE IF NOT EXISTS records (
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

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_ruler_id ON records(ruler_id);
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(record_date);
  `);
}
