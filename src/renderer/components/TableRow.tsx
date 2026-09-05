import { useState } from 'react';
import type { NoteWithInstruments } from '../hooks/useNotes';
import { formatDuration, formatDate } from '../lib/format';

interface TableRowProps {
  note: NoteWithInstruments;
  onToggle: () => void;
}

export function TableRow({ note, onToggle }: TableRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggle() {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const nextStatus: 0 | 1 = note.is_used === 0 ? 1 : 0;
      const result = await window.vaultAPI.notes.update({
        id: note.id,
        is_used: nextStatus,
      });
      if (result.success) {
        onToggle();
      }
    } catch {
      // Keep row if toggle fails
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <tr
      data-testid={`note-row-${note.id}`}
      className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors text-content-primary"
    >
      {/* 1. Title */}
      <td className="px-4 py-3 font-medium max-w-[180px] truncate" title={note.title}>
        {note.title}
      </td>

      {/* 2. Duration */}
      <td className="px-4 py-3 text-content-secondary tabular-nums whitespace-nowrap">
        {formatDuration(note.duration_seconds)}
      </td>

      {/* 3. BPM */}
      <td className="px-4 py-3 text-content-secondary tabular-nums whitespace-nowrap">
        {note.bpm ?? ''}
      </td>

      {/* 4. Musical Key */}
      <td className="px-4 py-3 text-content-secondary whitespace-nowrap">
        {note.musical_key ?? ''}
      </td>

      {/* 5. Authors */}
      <td className="px-4 py-3 text-content-secondary max-w-[140px] truncate" title={note.authors ?? ''}>
        {note.authors ?? ''}
      </td>

      {/* 6. Section */}
      <td className="px-4 py-3 text-content-secondary whitespace-nowrap">
        {note.song_section ?? ''}
      </td>

      {/* 7. Instruments */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {note.instruments.map((inst) => (
            <span
              key={inst.id}
              className="inline-block px-2 py-0.5 text-xs rounded-full bg-surface-secondary text-content-secondary border border-border"
            >
              {inst.name}
            </span>
          ))}
        </div>
      </td>

      {/* 8. Date Created */}
      <td className="px-4 py-3 text-content-secondary whitespace-nowrap">
        {formatDate(note.created_at)}
      </td>

      {/* 9. Notes (last column, truncated with ellipsis) */}
      <td
        className="px-4 py-3 text-content-secondary max-w-[160px] truncate cursor-default"
        title={note.notes ?? ''}
      >
        {note.notes ?? ''}
      </td>

      {/* 10. Action Toggle */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          data-testid={`toggle-note-${note.id}`}
          aria-label={note.is_used === 0 ? 'Archive this idea' : 'Restore this idea'}
          title={note.is_used === 0 ? 'Archive this idea' : 'Restore this idea'}
          className="p-1.5 rounded-md hover:bg-surface-secondary text-content-secondary hover:text-accent transition-colors disabled:opacity-50"
        >
          {note.is_used === 0 ? <ArchiveIcon /> : <RestoreIcon />}
        </button>
      </td>
    </tr>
  );
}

function ArchiveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
