import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { runMigrations } from '../migrations';
import { createNote, getNotes, getNoteById, updateNote, deleteNote } from '../note-repository';
import { getAllInstruments } from '../instrument-repository';

describe('Note Repository (Create, Read, Update, Delete)', () => {
  let dbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-notes-'));
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

  it('1. creates a note with all fields and returns complete AudioNote', () => {
    const note = createNote(db, {
      title: 'Heavy Riff In D',
      file_path: '/audio/vault/riff1.wav',
      duration_seconds: 45.2,
      bpm: 140,
      musical_key: 'D Minor',
      authors: 'John Doe, Jane Smith',
      song_section: 'Chorus',
      notes: 'Recorded with overdrive pedal',
      instrument_names: ['Electric Guitar', 'Bass'],
    });

    expect(note.id).toBe(1);
    expect(note.title).toBe('Heavy Riff In D');
    expect(note.file_path).toBe('/audio/vault/riff1.wav');
    expect(note.duration_seconds).toBe(45.2);
    expect(note.bpm).toBe(140);
    expect(note.musical_key).toBe('D Minor');
    expect(note.authors).toBe('John Doe, Jane Smith');
    expect(note.song_section).toBe('Chorus');
    expect(note.notes).toBe('Recorded with overdrive pedal');
    expect(note.is_used).toBe(0);
    expect(note.created_at).toBeDefined();
    expect(note.updated_at).toBeDefined();

    const noteWithInstruments = getNoteById(db, note.id);
    expect(noteWithInstruments?.instruments.map((i) => i.name)).toEqual(['Bass', 'Electric Guitar']);
  });

  it('2. creates note without title assigning default title idea-1', () => {
    const note = createNote(db, {
      file_path: '/audio/vault/idea1.wav',
      duration_seconds: 12.0,
    });

    expect(note.title).toBe('idea-1');
  });

  it('3. maintains monotonic counter even when rows are deleted (idea-4 after deleting note 2)', () => {
    createNote(db, { file_path: '/path/1.wav', duration_seconds: 10 }); // idea-1
    const n2 = createNote(db, { file_path: '/path/2.wav', duration_seconds: 20 }); // idea-2
    createNote(db, { file_path: '/path/3.wav', duration_seconds: 30 }); // idea-3

    // Delete middle note
    deleteNote(db, n2.id);

    const n4 = createNote(db, { file_path: '/path/4.wav', duration_seconds: 40 }); // idea-4
    expect(n4.title).toBe('idea-4');
  });

  it('4. throws when creating note with invalid bpm <= 0 due to CHECK constraint', () => {
    expect(() => {
      createNote(db, {
        file_path: '/path/invalid.wav',
        duration_seconds: 15,
        bpm: -10,
      });
    }).toThrow();
  });

  it('5. creates note with bpm: null successfully', () => {
    const note = createNote(db, {
      file_path: '/path/null-bpm.wav',
      duration_seconds: 25,
      bpm: null,
    });

    expect(note.bpm).toBeNull();
  });

  it('6. creates instruments in catalog when instrument_names are provided', () => {
    createNote(db, {
      file_path: '/path/instruments.wav',
      duration_seconds: 30,
      instrument_names: ['Acoustic Guitar', 'Harmonica'],
    });

    const instruments = getAllInstruments(db);
    expect(instruments.map((i) => i.name)).toEqual(['Acoustic Guitar', 'Harmonica']);
  });

  it('7. reuses existing instrument rows when creating multiple notes with same instrument', () => {
    createNote(db, {
      file_path: '/path/1.wav',
      duration_seconds: 10,
      instrument_names: ['Synthesizer'],
    });

    createNote(db, {
      file_path: '/path/2.wav',
      duration_seconds: 20,
      instrument_names: ['Synthesizer'],
    });

    const instruments = getAllInstruments(db);
    expect(instruments).toHaveLength(1);
    expect(instruments[0].name).toBe('Synthesizer');
  });

  it('8. returns notes ordered by created_at DESC by default', async () => {
    createNote(db, {
      title: 'First Note',
      file_path: '/path/1.wav',
      duration_seconds: 10,
    });

    db.prepare("UPDATE audio_notes SET created_at = '2026-01-01 10:00:00' WHERE title = 'First Note'").run();

    createNote(db, {
      title: 'Second Note',
      file_path: '/path/2.wav',
      duration_seconds: 20,
    });
    db.prepare("UPDATE audio_notes SET created_at = '2026-01-02 10:00:00' WHERE title = 'Second Note'").run();

    createNote(db, {
      title: 'Third Note',
      file_path: '/path/3.wav',
      duration_seconds: 30,
    });
    db.prepare("UPDATE audio_notes SET created_at = '2026-01-03 10:00:00' WHERE title = 'Third Note'").run();

    const notes = getNotes(db);
    expect(notes.map((n) => n.title)).toEqual(['Third Note', 'Second Note', 'First Note']);
  });

  it('9. filters notes by is_used state (is_used: 0)', () => {
    const n1 = createNote(db, { title: 'Available Note', file_path: '/path/1.wav', duration_seconds: 10 });
    const n2 = createNote(db, { title: 'Used Note', file_path: '/path/2.wav', duration_seconds: 20 });

    db.prepare('UPDATE audio_notes SET is_used = 1 WHERE id = ?').run(n2.id);

    const availableNotes = getNotes(db, { is_used: 0 });
    expect(availableNotes).toHaveLength(1);
    expect(availableNotes[0].id).toBe(n1.id);
    expect(availableNotes[0].title).toBe('Available Note');

    const usedNotes = getNotes(db, { is_used: 1 });
    expect(usedNotes).toHaveLength(1);
    expect(usedNotes[0].id).toBe(n2.id);
    expect(usedNotes[0].title).toBe('Used Note');
  });

  it('10. stores omitted or empty optional text fields as null, not empty strings', () => {
    const note = createNote(db, {
      file_path: '/path/empty-strings.wav',
      duration_seconds: 18,
      musical_key: '   ',
      authors: '',
      song_section: undefined,
      notes: null,
    });

    expect(note.musical_key).toBeNull();
    expect(note.authors).toBeNull();
    expect(note.song_section).toBeNull();
    expect(note.notes).toBeNull();
  });

  it('11. updates is_used from 0 to 1 and persists correctly', () => {
    const note = createNote(db, {
      file_path: '/path/note.wav',
      duration_seconds: 10,
    });
    expect(note.is_used).toBe(0);

    const updated = updateNote(db, {
      id: note.id,
      is_used: 1,
    });

    expect(updated.is_used).toBe(1);

    const fetched = getNoteById(db, note.id);
    expect(fetched?.is_used).toBe(1);
  });

  it('12. updates title and BPM, leaving other fields intact and advancing updated_at', () => {
    const note = createNote(db, {
      title: 'Original Title',
      file_path: '/path/note.wav',
      duration_seconds: 15,
      bpm: 100,
      musical_key: 'C Major',
    });

    // Set updated_at to earlier timestamp
    db.prepare("UPDATE audio_notes SET updated_at = '2026-01-01 00:00:00' WHERE id = ?").run(note.id);

    const updated = updateNote(db, {
      id: note.id,
      title: 'Updated Title',
      bpm: 128,
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.bpm).toBe(128);
    expect(updated.musical_key).toBe('C Major');
    expect(updated.updated_at).not.toBe('2026-01-01 00:00:00');
  });

  it('13. updates instrument list by removing old associations and adding new ones', () => {
    const note = createNote(db, {
      file_path: '/path/note.wav',
      duration_seconds: 10,
      instrument_names: ['Guitar', 'Bass'],
    });

    const before = getNoteById(db, note.id);
    expect(before?.instruments.map((i) => i.name)).toEqual(['Bass', 'Guitar']);

    updateNote(db, {
      id: note.id,
      instrument_names: ['Drums', 'Piano'],
    });

    const after = getNoteById(db, note.id);
    expect(after?.instruments.map((i) => i.name)).toEqual(['Drums', 'Piano']);
  });

  it('14. deletes note, removing row and all junction table rows', () => {
    const note = createNote(db, {
      file_path: '/path/delete-me.wav',
      duration_seconds: 10,
      instrument_names: ['Flute', 'Violin'],
    });

    const result = deleteNote(db, note.id);
    expect(result).toEqual({ file_path: '/path/delete-me.wav' });

    const fetched = getNoteById(db, note.id);
    expect(fetched).toBeNull();

    const junctionRows = db
      .prepare('SELECT * FROM audio_note_instruments WHERE audio_note_id = ?')
      .all(note.id);
    expect(junctionRows).toHaveLength(0);
  });

  it('15. deleting note keeps orphaned instruments in catalog', () => {
    const note = createNote(db, {
      file_path: '/path/orphan.wav',
      duration_seconds: 10,
      instrument_names: ['Cello'],
    });

    deleteNote(db, note.id);

    const instruments = getAllInstruments(db);
    expect(instruments.some((i) => i.name === 'Cello')).toBe(true);
  });

  it('16. returns null when attempting to delete non-existent note id', () => {
    const result = deleteNote(db, 9999);
    expect(result).toBeNull();
  });

  it('17. updates duration_seconds successfully when non-negative', () => {
    const note = createNote(db, {
      file_path: '/path/duration-fix.m4a',
      duration_seconds: 0,
      title: 'Duration Test',
    });

    expect(note.duration_seconds).toBe(0);

    const updated = updateNote(db, {
      id: note.id,
      duration_seconds: 84.5,
    });

    expect(updated.duration_seconds).toBe(84.5);
    const fetched = getNoteById(db, note.id);
    expect(fetched?.duration_seconds).toBe(84.5);
  });
});
