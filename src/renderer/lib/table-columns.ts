export interface TableColumnConfig {
  id: string;
  label: string;
  widthClass: string;
  align: 'left' | 'center';
  tooltip?: string;
}

export const TABLE_COLUMNS: TableColumnConfig[] = [
  { id: 'select', label: '', widthClass: 'w-10', align: 'center' },
  { id: 'playback', label: '', widthClass: 'w-10', align: 'center' },
  {
    id: 'title',
    label: 'Title',
    widthClass: 'w-[18%]',
    align: 'left',
    tooltip: 'Name or identifier of the audio idea.',
  },
  {
    id: 'duration',
    label: 'Duration',
    widthClass: 'w-[8%]',
    align: 'center',
    tooltip: 'Total audio length in mm:ss format.',
  },
  {
    id: 'bpm',
    label: 'BPM',
    widthClass: 'w-[7%]',
    align: 'center',
    tooltip: 'Beats per minute tempo (positive numeric value).',
  },
  {
    id: 'key',
    label: 'Key',
    widthClass: 'w-[7%]',
    align: 'center',
    tooltip: 'Musical key signature (e.g., C maj, A min, F#).',
  },
  {
    id: 'authors',
    label: 'Authors',
    widthClass: 'w-[13%]',
    align: 'center',
    tooltip: 'Songwriters and performers. In edit mode, separate multiple authors with commas.',
  },
  {
    id: 'section',
    label: 'Section',
    widthClass: 'w-[9%]',
    align: 'center',
    tooltip: 'Song structure section (e.g., Intro, Verse, Chorus, Bridge, Outro).',
  },
  {
    id: 'instruments',
    label: 'Instruments',
    widthClass: 'w-[15%]',
    align: 'center',
    tooltip: 'Musical instruments tagged on this idea. In edit mode, separate multiple instruments with commas.',
  },
  {
    id: 'created',
    label: 'Created',
    widthClass: 'w-[10%]',
    align: 'center',
    tooltip: 'Date and time the audio idea was recorded or imported.',
  },
  {
    id: 'notes',
    label: 'Notes',
    widthClass: 'w-[15%]',
    align: 'left',
    tooltip: 'Production notes, lyrics, chords, or reminders. Click in view mode to read full text.',
  },
  { id: 'action', label: '', widthClass: 'w-12', align: 'center' },
];
