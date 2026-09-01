import type Database from 'better-sqlite3';
import type {
  AudioNote,
  CreateAudioNoteInput,
  UpdateAudioNoteInput,
  Instrument,
  NoteFilters,
} from '@shared/types';
import { getOrCreateInstrument, getInstrumentsByNoteId } from './instrument-repository';

/** Helper to clean optional string fields to null if empty or undefined */
function sanitizeOptionalString(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** [FR-1, FR-3, FR-4, FR-5, FR-8, FR-10, FR-11] Create a new audio note */
export function createNote(db: Database.Database, input: CreateAudioNoteInput): AudioNote {
  return db.transaction(() => {
    // Monotonic counter for auto-generated title
    const metaRow = db
      .prepare("SELECT value FROM app_meta WHERE key = 'next_note_number'")
      .get() as { value: string };
    const currentNum = parseInt(metaRow.value, 10);
    const nextNum = currentNum + 1;

    // Increment monotonic counter regardless of user title
    db.prepare("UPDATE app_meta SET value = ? WHERE key = 'next_note_number'").run(
      String(nextNum)
    );

    const providedTitle = sanitizeOptionalString(input.title);
    const title = providedTitle !== null ? providedTitle : `idea-${currentNum}`;

    const musicalKey = sanitizeOptionalString(input.musical_key);
    const authors = sanitizeOptionalString(input.authors);
    const songSection = sanitizeOptionalString(input.song_section);
    const notes = sanitizeOptionalString(input.notes);
    const bpm = input.bpm !== undefined && input.bpm !== null ? input.bpm : null;

    const info = db
      .prepare(`
        INSERT INTO audio_notes (
          title, file_path, duration_seconds, bpm, musical_key, authors, song_section, notes, is_used
        ) VALUES (
          :title, :file_path, :duration_seconds, :bpm, :musical_key, :authors, :song_section, :notes, 0
        )
      `)
      .run({
        title,
        file_path: input.file_path,
        duration_seconds: input.duration_seconds,
        bpm,
        musical_key: musicalKey,
        authors,
        song_section: songSection,
        notes,
      });

    const noteId = Number(info.lastInsertRowid);

    if (input.instrument_names && input.instrument_names.length > 0) {
      const linkStmt = db.prepare(`
        INSERT OR IGNORE INTO audio_note_instruments (audio_note_id, instrument_id)
        VALUES (?, ?)
      `);

      for (const instName of input.instrument_names) {
        const trimmed = instName.trim();
        if (trimmed.length > 0) {
          const inst = getOrCreateInstrument(db, trimmed);
          linkStmt.run(noteId, inst.id);
        }
      }
    }

    return db
      .prepare('SELECT * FROM audio_notes WHERE id = ?')
      .get(noteId) as AudioNote;
  })();
}

/** [FR-13, FR-14, NFR-3] Get all audio notes matching filters, ordered by created_at DESC */
export function getNotes(db: Database.Database, filters: NoteFilters = {}): AudioNote[] {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.is_used !== undefined) {
    conditions.push('an.is_used = :is_used');
    params['is_used'] = filters.is_used;
  }
  if (filters.musical_key) {
    conditions.push('an.musical_key = :musical_key');
    params['musical_key'] = filters.musical_key;
  }
  if (filters.song_section) {
    conditions.push('an.song_section = :song_section');
    params['song_section'] = filters.song_section;
  }
  if (filters.bpm_min !== undefined) {
    conditions.push('an.bpm >= :bpm_min');
    params['bpm_min'] = filters.bpm_min;
  }
  if (filters.bpm_max !== undefined) {
    conditions.push('an.bpm <= :bpm_max');
    params['bpm_max'] = filters.bpm_max;
  }
  if (filters.search) {
    conditions.push('(an.title LIKE :search OR an.authors LIKE :search OR an.notes LIKE :search)');
    params['search'] = `%${filters.search}%`;
  }
  if (filters.instrument_name) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM audio_note_instruments ani
        JOIN instruments i ON ani.instrument_id = i.id
        WHERE ani.audio_note_id = an.id AND i.name = :instrument_name
      )
    `);
    params['instrument_name'] = filters.instrument_name;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT an.* FROM audio_notes an ${whereClause} ORDER BY an.created_at DESC`;

  return db.prepare(sql).all(params) as AudioNote[];
}

/** Get a single note by ID with its associated instruments */
export function getNoteById(
  db: Database.Database,
  id: number
): (AudioNote & { instruments: Instrument[] }) | null {
  const note = db
    .prepare('SELECT * FROM audio_notes WHERE id = ?')
    .get(id) as AudioNote | undefined;

  if (!note) {
    return null;
  }

  const instruments = getInstrumentsByNoteId(db, id);
  return {
    ...note,
    instruments,
  };
}

/** [FR-1, FR-8] Update mutable fields + instrument associations */
export function updateNote(db: Database.Database, input: UpdateAudioNoteInput): AudioNote {
  return db.transaction(() => {
    const existing = db
      .prepare('SELECT * FROM audio_notes WHERE id = ?')
      .get(input.id) as AudioNote | undefined;

    if (!existing) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    const setClauses: string[] = ["updated_at = datetime('now')"];
    const params: Record<string, unknown> = { id: input.id };

    if (input.title !== undefined) {
      const sanitized = sanitizeOptionalString(input.title);
      if (sanitized !== null) {
        setClauses.push('title = :title');
        params['title'] = sanitized;
      }
    }

    if (input.bpm !== undefined) {
      setClauses.push('bpm = :bpm');
      params['bpm'] = input.bpm;
    }

    if (input.musical_key !== undefined) {
      setClauses.push('musical_key = :musical_key');
      params['musical_key'] = sanitizeOptionalString(input.musical_key);
    }

    if (input.authors !== undefined) {
      setClauses.push('authors = :authors');
      params['authors'] = sanitizeOptionalString(input.authors);
    }

    if (input.song_section !== undefined) {
      setClauses.push('song_section = :song_section');
      params['song_section'] = sanitizeOptionalString(input.song_section);
    }

    if (input.notes !== undefined) {
      setClauses.push('notes = :notes');
      params['notes'] = sanitizeOptionalString(input.notes);
    }

    if (input.is_used !== undefined) {
      setClauses.push('is_used = :is_used');
      params['is_used'] = input.is_used;
    }

    const sql = `UPDATE audio_notes SET ${setClauses.join(', ')} WHERE id = :id`;
    db.prepare(sql).run(params);

    if (input.instrument_names !== undefined) {
      db.prepare('DELETE FROM audio_note_instruments WHERE audio_note_id = ?').run(input.id);

      if (input.instrument_names.length > 0) {
        const linkStmt = db.prepare(`
          INSERT OR IGNORE INTO audio_note_instruments (audio_note_id, instrument_id)
          VALUES (?, ?)
        `);

        for (const instName of input.instrument_names) {
          const trimmed = instName.trim();
          if (trimmed.length > 0) {
            const inst = getOrCreateInstrument(db, trimmed);
            linkStmt.run(input.id, inst.id);
          }
        }
      }
    }

    return db
      .prepare('SELECT * FROM audio_notes WHERE id = ?')
      .get(input.id) as AudioNote;
  })();
}

/** [FR-15, FR-16] Hard delete — removes row, junction rows (CASCADE), returns file_path */
export function deleteNote(db: Database.Database, id: number): { file_path: string } | null {
  return db.transaction(() => {
    const existing = db
      .prepare('SELECT file_path FROM audio_notes WHERE id = ?')
      .get(id) as { file_path: string } | undefined;

    if (!existing) {
      return null;
    }

    db.prepare('DELETE FROM audio_notes WHERE id = ?').run(id);

    return { file_path: existing.file_path };
  })();
}
