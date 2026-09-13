import type { NoteWithInstruments } from '../hooks/useNotes';
import type { TableMode, EditableField, ActiveCellId } from '../types/inline-edit';
import { TABLE_COLUMNS } from '../lib/table-columns';
import { TableRow } from './TableRow';
import { EmptyState } from './EmptyState';

export interface IdeasTableProps {
  isUsed: 0 | 1;
  notes: NoteWithInstruments[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  tableMode: TableMode;
  activeCellId: ActiveCellId;
  onCellClick: (noteId: number, field: EditableField) => void;
  onCellCommit: (noteId: number, field: EditableField, value: string) => void;
  onNoteClick?: (note: NoteWithInstruments) => void;
  selectedIds?: Set<number>;
  onRowSelect?: (noteId: number, index: number, shiftKey: boolean) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function IdeasTable({
  isUsed,
  notes,
  loading,
  error,
  onRefetch,
  tableMode,
  activeCellId,
  onCellClick,
  onCellCommit,
  onNoteClick,
  selectedIds,
  onRowSelect,
}: IdeasTableProps) {
  if (loading) {
    return (
      <div
        data-testid="table-loading"
        className="flex items-center justify-center h-64 text-content-secondary text-sm animate-pulse"
      >
        Loading ideas…
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="table-error"
        className="flex flex-col items-center justify-center h-64 text-red-500 text-sm p-6"
      >
        <p className="font-medium mb-2">Failed to load ideas</p>
        <p className="text-xs text-content-secondary mb-4">{error}</p>
        <button
          onClick={onRefetch}
          className="px-3 py-1 text-xs rounded-md bg-surface-secondary text-content-primary border border-border hover:bg-surface-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (notes.length === 0) {
    return <EmptyState isArchive={isUsed === 1} />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed text-xs border-collapse min-w-[1100px]">
        <thead className="sticky top-0 bg-surface-primary border-b border-border z-10">
          <tr>
            {TABLE_COLUMNS.map((col, index) => (
              <th
                key={col.id || index}
                scope="col"
                title={col.tooltip}
                className={`px-4 py-2.5 font-semibold text-content-secondary uppercase tracking-wider text-[11px] text-center cursor-default select-none ${col.widthClass} ${
                  index === 0 ? 'px-3' : index === 1 ? 'px-2' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {notes.map((note, index) => (
            <TableRow
              key={note.id}
              note={note}
              index={index}
              tableMode={tableMode}
              activeCellId={activeCellId}
              isSelected={selectedIds?.has(note.id) ?? false}
              onSelect={onRowSelect}
              onCellClick={onCellClick}
              onCellCommit={onCellCommit}
              onNoteClick={onNoteClick}
              onToggle={onRefetch}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
