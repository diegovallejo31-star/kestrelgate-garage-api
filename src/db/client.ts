import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/** Opens a database, creating it and its tables where it is not there yet. */
export function openDatabase(databasePath: string): DatabaseSync {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return db;
}

export type Database = DatabaseSync;

/**
 * Runs fn inside a transaction, rolling back if it throws.
 *
 * Deliberately not re-entrant: a caller that wraps another caller would commit
 * the outer work when the inner one finished, which is the sort of bug that is
 * only noticed when something has already been half-written.
 */
export function inTransaction<T>(db: Database, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
