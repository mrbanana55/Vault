/** Represents an audio note as returned from the database. */
export interface AudioNote {
  id: number;
  title: string;
  file_path: string;
  duration_seconds: number;
  bpm: number | null;
  musical_key: string | null;
  authors: string | null;
  song_section: string | null;
  notes: string | null;
  is_used: 0 | 1;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** Fields the user can supply when creating a new note. */
export interface CreateAudioNoteInput {
  title?: string;
  file_path: string;
  duration_seconds: number;
  bpm?: number | null;
  musical_key?: string | null;
  authors?: string | null;
  song_section?: string | null;
  notes?: string | null;
  instrument_names?: string[];
}

/** Fields the user can update on an existing note. */
export interface UpdateAudioNoteInput {
  id: number;
  title?: string;
  bpm?: number | null;
  musical_key?: string | null;
  authors?: string | null;
  song_section?: string | null;
  notes?: string | null;
  is_used?: 0 | 1;
  instrument_names?: string[];
}
