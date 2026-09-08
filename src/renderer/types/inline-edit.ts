export type TableMode = 'view' | 'edit';

export type EditableField =
  | 'title'
  | 'bpm'
  | 'musical_key'
  | 'authors'
  | 'song_section'
  | 'notes'
  | 'instruments';

export interface ActiveCell {
  noteId: number;
  field: EditableField;
}

export type ActiveCellId = ActiveCell | null;

export const EDITABLE_FIELDS: ReadonlyArray<EditableField> = [
  'title',
  'bpm',
  'musical_key',
  'authors',
  'song_section',
  'notes',
  'instruments',
] as const;

export function isEditableField(field: string): field is EditableField {
  return (EDITABLE_FIELDS as ReadonlyArray<string>).includes(field);
}
