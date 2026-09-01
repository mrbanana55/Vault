import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { runMigrations } from '../migrations';
import {
  getAllInstruments,
  getOrCreateInstrument,
  getInstrumentsByNoteId,
} from '../instrument-repository';

describe('Instrument Repository', () => {
  let dbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-instruments-'));
    dbPath = path.join(tempDir, 'test.db');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
    const tempDir = path.dirname(dbPath);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('calling getOrCreateInstrument twice with the same name returns the same id', () => {
    const inst1 = getOrCreateInstrument(db, 'Guitar');
    const inst2 = getOrCreateInstrument(db, 'Guitar');

    expect(inst1.name).toBe('Guitar');
    expect(inst2.name).toBe('Guitar');
    expect(inst1.id).toBe(inst2.id);

    const all = getAllInstruments(db);
    expect(all).toHaveLength(1);
  });

  it('getAllInstruments returns the full catalog sorted by name', () => {
    getOrCreateInstrument(db, 'Piano');
    getOrCreateInstrument(db, 'Bass');
    getOrCreateInstrument(db, 'Drums');

    const all = getAllInstruments(db);
    expect(all).toHaveLength(3);
    expect(all.map((i) => i.name)).toEqual(['Bass', 'Drums', 'Piano']);
  });

  it('treats instrument name uniqueness as case-sensitive', () => {
    const inst1 = getOrCreateInstrument(db, 'Guitar');
    const inst2 = getOrCreateInstrument(db, 'guitar');

    expect(inst1.id).not.toBe(inst2.id);

    const all = getAllInstruments(db);
    expect(all).toHaveLength(2);
    expect(all.map((i) => i.name)).toEqual(['Guitar', 'guitar']);
  });

  it('retrieves instruments associated with a specific note id', () => {
    const inst1 = getOrCreateInstrument(db, 'Violin');
    const inst2 = getOrCreateInstrument(db, 'Cello');

    db.prepare(`
      INSERT INTO audio_notes (title, file_path, duration_seconds)
      VALUES ('note-1', '/path/1.wav', 12.5)
    `).run();

    const noteId = 1;

    db.prepare(`
      INSERT INTO audio_note_instruments (audio_note_id, instrument_id)
      VALUES (?, ?), (?, ?)
    `).run(noteId, inst1.id, noteId, inst2.id);

    const associated = getInstrumentsByNoteId(db, noteId);
    expect(associated).toHaveLength(2);
    expect(associated.map((i) => i.name)).toEqual(['Cello', 'Violin']);
  });
});
