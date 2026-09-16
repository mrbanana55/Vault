export interface IdeaFilterCriteria {
  /** Optional minimum tempo (BPM >= bpmMin) */
  bpmMin?: number;
  /** Optional maximum tempo (BPM <= bpmMax) */
  bpmMax?: number;
  /** Optional musical key query (case-insensitive substring) */
  key?: string;
  /** Optional author/collaborator query (supports comma-separated multi-token AND matching) */
  authors?: string;
  /** Optional song section query (case-insensitive substring) */
  section?: string;
  /** Optional instrument query (supports comma-separated multi-token AND matching) */
  instruments?: string;
}

export const INITIAL_FILTER_CRITERIA: Readonly<IdeaFilterCriteria> = Object.freeze({
  bpmMin: undefined,
  bpmMax: undefined,
  key: '',
  authors: '',
  section: '',
  instruments: '',
});

export const FILTER_TOOLTIPS = {
  bpm: 'Tempo in beats per minute. Specify a minimum, maximum, or both to filter by range.',
  key: 'Musical key signature (e.g., C maj, A min, F#). Matches partial text.',
  authors: 'Songwriters and performers. Separate multiple authors with commas to require all of them (e.g., John, Paul).',
  section: 'Song section (e.g., Chorus, Verse, Bridge, Intro). Matches partial text.',
  instruments: 'Musical instruments tagged on the idea. Separate multiple instruments with commas to require all of them (e.g., Guitar, Piano).',
} as const;
