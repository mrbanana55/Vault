import type Database from 'better-sqlite3';
import { up as initialSchemaUp } from './001-initial-schema';

export interface Migration {
  id: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  { id: '001-initial-schema', up: initialSchemaUp },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedRows = db
    .prepare('SELECT id FROM _migrations')
    .all() as { id: string }[];

  const applied = new Set(appliedRows.map((row) => row.id));

  for (const migration of migrations) {
    if (!applied.has(migration.id)) {
      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO _migrations (id) VALUES (?)').run(migration.id);
      })();
    }
  }
}
