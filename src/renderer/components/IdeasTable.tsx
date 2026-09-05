import { useNotes } from '../hooks/useNotes';
import { TableRow } from './TableRow';
import { EmptyState } from './EmptyState';

interface IdeasTableProps {
  isUsed: 0 | 1;
}

const TABLE_COLUMNS = [
  'Title',
  'Duration',
  'BPM',
  'Key',
  'Authors',
  'Section',
  'Instruments',
  'Created',
  'Notes',
  '',
];

export function IdeasTable({ isUsed }: IdeasTableProps) {
  const { notes, loading, error, refetch } = useNotes(isUsed);

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
          onClick={refetch}
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
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-surface-primary border-b border-border z-10">
          <tr>
            {TABLE_COLUMNS.map((col, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2.5 font-semibold text-content-secondary uppercase tracking-wider text-[11px]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {notes.map((note) => (
            <TableRow key={note.id} note={note} onToggle={refetch} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
