import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'financial_planner.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL,
      email TEXT   UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL DEFAULT 1,
      name         TEXT    NOT NULL,
      institution  TEXT    NOT NULL DEFAULT '',
      type         TEXT    NOT NULL,
      balance      REAL    NOT NULL DEFAULT 0,
      is_liability INTEGER NOT NULL DEFAULT 0,
      currency     TEXT    NOT NULL DEFAULT 'USD',
      color        TEXT    NOT NULL DEFAULT '#4F46E5',
      last_synced  TEXT,
      created_at   TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      icon      TEXT    NOT NULL DEFAULT '📦',
      color     TEXT    NOT NULL DEFAULT '#94A3B8',
      is_income INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id  INTEGER NOT NULL,
      date        TEXT    NOT NULL,
      merchant    TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      category_id INTEGER,
      notes       TEXT    DEFAULT '',
      is_pending  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (account_id)  REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL DEFAULT 1,
      category_id INTEGER NOT NULL,
      month       INTEGER NOT NULL,
      year        INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      UNIQUE(user_id, category_id, month, year),
      FOREIGN KEY (user_id)     REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL DEFAULT 1,
      name           TEXT    NOT NULL,
      type           TEXT    NOT NULL DEFAULT 'savings',
      target_amount  REAL    NOT NULL,
      current_amount REAL    NOT NULL DEFAULT 0,
      target_date    TEXT,
      account_id     INTEGER,
      color          TEXT    NOT NULL DEFAULT '#4F46E5',
      notes          TEXT    DEFAULT '',
      created_at     TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS net_worth_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL DEFAULT 1,
      date        TEXT    NOT NULL,
      assets      REAL    NOT NULL,
      liabilities REAL    NOT NULL,
      net_worth   REAL    NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}
