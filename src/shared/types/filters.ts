export interface NoteFilters {
  is_used?: 0 | 1;
  search?: string;
  bpm_min?: number;
  bpm_max?: number;
  musical_key?: string;
  song_section?: string;
  instrument_name?: string;
}
