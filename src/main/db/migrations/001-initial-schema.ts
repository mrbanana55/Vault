import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audio_notes (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT    NOT NULL,
      file_path        TEXT    NOT NULL,
      duration_seconds REAL    NOT NULL,
      bpm              REAL    DEFAULT NULL CHECK (bpm IS NULL OR bpm > 0),
      musical_key      TEXT    DEFAULT NULL,
      authors          TEXT    DEFAULT NULL,
      song_section     TEXT    DEFAULT NULL,
      notes            TEXT    DEFAULT NULL,
      is_used          INTEGER NOT NULL DEFAULT 0 CHECK (is_used IN (0, 1)),
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS instruments (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS audio_note_instruments (
      audio_note_id INTEGER NOT NULL REFERENCES audio_notes(id) ON DELETE CASCADE,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
      PRIMARY KEY (audio_note_id, instrument_id)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO app_meta (key, value) VALUES ('next_note_number', '1');
  `);
}
