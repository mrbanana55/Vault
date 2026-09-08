import type { UpdateAudioNoteInput } from '@shared/types';
import type { EditableField } from '../types/inline-edit';
import type { NoteWithInstruments } from '../hooks/useNotes';

export type FieldUpdateValue = Omit<UpdateAudioNoteInput, 'id'>;

export interface TransformResult {
  valid: boolean;
  value: FieldUpdateValue | null;
}

export function transformFieldValue(
  field: EditableField,
  rawValue: string
): TransformResult {
  const trimmed = rawValue.trim();

  switch (field) {
    case 'title': {
      if (trimmed.length === 0) {
        return { valid: false, value: null };
      }
      return { valid: true, value: { title: trimmed } };
    }

    case 'bpm': {
      if (trimmed.length === 0) {
        return { valid: true, value: { bpm: null } };
      }
      const num = Number(trimmed);
      if (!Number.isFinite(num) || num <= 0) {
        return { valid: false, value: null };
      }
      return { valid: true, value: { bpm: num } };
    }

    case 'musical_key': {
      return {
        valid: true,
        value: { musical_key: trimmed.length > 0 ? trimmed : null },
      };
    }

    case 'authors': {
      return {
        valid: true,
        value: { authors: trimmed.length > 0 ? trimmed : null },
      };
    }

    case 'song_section': {
      return {
        valid: true,
        value: { song_section: trimmed.length > 0 ? trimmed : null },
      };
    }

    case 'notes': {
      return {
        valid: true,
        value: { notes: trimmed.length > 0 ? trimmed : null },
      };
    }

    case 'instruments': {
      const instrumentNames = rawValue
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return {
        valid: true,
        value: { instrument_names: instrumentNames },
      };
    }

    default: {
      const _exhaustive: never = field;
      return { valid: false, value: null };
    }
  }
}

export function getNoteFieldDisplayValue(
  note: NoteWithInstruments,
  field: EditableField
): string {
  switch (field) {
    case 'title':
      return note.title ?? '';
    case 'bpm':
      return note.bpm !== null && note.bpm !== undefined ? String(note.bpm) : '';
    case 'musical_key':
      return note.musical_key ?? '';
    case 'authors':
      return note.authors ?? '';
    case 'song_section':
      return note.song_section ?? '';
    case 'notes':
      return note.notes ?? '';
    case 'instruments':
      return (note.instruments ?? []).map((i) => i.name).join(', ');
    default: {
      const _exhaustive: never = field;
      return '';
    }
  }
}
