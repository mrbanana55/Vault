import type Database from 'better-sqlite3';
import type { Instrument } from '../../shared/types';

/** [FR-9] List all instruments in the catalog */
export function getAllInstruments(db: Database.Database): Instrument[] {
  return db
    .prepare('SELECT id, name FROM instruments ORDER BY name ASC')
    .all() as Instrument[];
}

/** [FR-10] Get or create an instrument by name, returns the instrument object */
export function getOrCreateInstrument(db: Database.Database, name: string): Instrument {
  const existing = db
    .prepare('SELECT id, name FROM instruments WHERE name = ?')
    .get(name) as Instrument | undefined;

  if (existing) {
    return existing;
  }

  const result = db
    .prepare('INSERT INTO instruments (name) VALUES (?)')
    .run(name);

  return {
    id: Number(result.lastInsertRowid),
    name,
  };
}

/** Get instruments associated with a specific note */
export function getInstrumentsByNoteId(db: Database.Database, noteId: number): Instrument[] {
  return db
    .prepare(`
      SELECT i.id, i.name
      FROM instruments i
      INNER JOIN audio_note_instruments ani ON i.id = ani.instrument_id
      WHERE ani.audio_note_id = ?
      ORDER BY i.name ASC
    `)
    .all(noteId) as Instrument[];
}
