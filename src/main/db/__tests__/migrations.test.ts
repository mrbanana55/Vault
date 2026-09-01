import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { runMigrations } from '../migrations';

describe('Database Migrations', () => {
  let dbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-'));
    dbPath = path.join(tempDir, 'test.db');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
    const tempDir = path.dirname(dbPath);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('runs migrations on a fresh DB and creates all expected tables', () => {
    runMigrations(db);

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC"
      )
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('_migrations');
    expect(tableNames).toContain('app_meta');
    expect(tableNames).toContain('audio_note_instruments');
    expect(tableNames).toContain('audio_notes');
    expect(tableNames).toContain('instruments');
  });

  it('is idempotent when run multiple times', () => {
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();

    const applied = db
      .prepare('SELECT id FROM _migrations')
      .all() as { id: string }[];
    expect(applied).toHaveLength(1);
    expect(applied[0].id).toBe('001-initial-schema');
  });

  it('initializes app_meta with next_note_number = "1"', () => {
    runMigrations(db);

    const row = db
      .prepare("SELECT value FROM app_meta WHERE key = 'next_note_number'")
      .get() as { value: string } | undefined;

    expect(row).toBeDefined();
    expect(row?.value).toBe('1');
  });
});
