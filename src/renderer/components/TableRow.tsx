import React, { useState } from "react";
import type { NoteWithInstruments } from "../hooks/useNotes";
import type {
  TableMode,
  EditableField,
  ActiveCellId,
} from "../types/inline-edit";
import { formatDuration, formatDate } from "../lib/format";
import { getNoteFieldDisplayValue } from "../lib/field-transforms";
import { EditableCell } from "./EditableCell";
import { useAudioPlayer } from "../hooks/useAudioPlayer";

export interface TableRowProps {
  note: NoteWithInstruments;
  index: number;
  tableMode: TableMode;
  activeCellId: ActiveCellId;
  isSelected?: boolean;
  onSelect?: (noteId: number, index: number, shiftKey: boolean) => void;
  onCellClick: (noteId: number, field: EditableField) => void;
  onCellCommit: (noteId: number, field: EditableField, value: string) => void;
  onNoteClick?: (note: NoteWithInstruments) => void;
  onToggle: () => void;
}

export function TableRow({
  note,
  index,
  tableMode,
  activeCellId,
  isSelected = false,
  onSelect,
  onCellClick,
  onCellCommit,
  onNoteClick,
  onToggle,
}: TableRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { currentNote, isPlaying, togglePlay } = useAudioPlayer();

  const isCurrentNote = currentNote?.id === note.id;
  const isPlayingThisNote = isCurrentNote && isPlaying;

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

  function isEditingField(field: EditableField): boolean {
    return activeCellId?.noteId === note.id && activeCellId?.field === field;
  }

  function handleCheckboxClick(e: React.MouseEvent<HTMLInputElement>) {
    e.stopPropagation();
    if (e.shiftKey) {
      // Prevent browser text selection on shift-click
      window.getSelection()?.removeAllRanges();
    }
    onSelect?.(note.id, index, e.shiftKey);
  }

  const hasNotesContent = Boolean(note.notes && note.notes.trim().length > 0);

  // Row background hierarchy
  const rowBackground = isPlayingThisNote
    ? isSelected
      ? "bg-surface-secondary/90 ring-1 ring-accent-blue/50"
      : "bg-surface-secondary/60 hover:bg-surface-secondary/80"
    : isSelected
      ? "bg-surface-secondary/50 hover:bg-surface-secondary/70"
      : "hover:bg-surface-hover";

  return (
    <tr
      data-testid={`note-row-${note.id}`}
      className={`border-b border-border last:border-b-0 transition-colors text-content-primary ${rowBackground}`}
    >
      {/* 0. Selection Checkbox */}
      <td className="px-3 py-3 w-10 text-center cursor-default">
        <input
          type="checkbox"
          data-testid={`row-checkbox-${note.id}`}
          checked={isSelected}
          onChange={() => {}} // Controlled by onClick
          onClick={handleCheckboxClick}
          aria-label={`Select ${note.title}`}
          className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue/40 cursor-pointer accent-accent-blue align-middle"
        />
      </td>

      {/* 1. Play/Pause Action */}
      <td className="px-2 py-3 w-10 text-center cursor-default">
        <button
          type="button"
          onClick={() => togglePlay(note)}
          data-testid={`row-play-button-${note.id}`}
          aria-label={
            isPlayingThisNote ? `Pause ${note.title}` : `Play ${note.title}`
          }
          title={isPlayingThisNote ? "Pause" : "Play"}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            isPlayingThisNote
              ? "text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20"
              : "text-content-secondary hover:text-content-primary hover:bg-surface-secondary"
          }`}
        >
          {isPlayingThisNote ? <PauseIcon /> : <PlayIcon />}
        </button>
      </td>

      {/* 2. Title (Editable, Left-Aligned) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "title")}
        isEditing={isEditingField("title")}
        isEditable={true}
        tableMode={tableMode}
        align="left"
        onClick={() => onCellClick(note.id, "title")}
        onCommit={(val) => onCellCommit(note.id, "title", val)}
        className="font-medium truncate"
        title={note.title}
        data-testid={`cell-title-${note.id}`}
      >
        {note.title}
      </EditableCell>

      {/* 3. Duration (Non-editable, Centered) */}
      <td className="px-4 py-3 text-center text-content-secondary tabular-nums whitespace-nowrap cursor-default">
        {formatDuration(note.duration_seconds)}
      </td>

      {/* 4. BPM (Editable, Centered) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "bpm")}
        isEditing={isEditingField("bpm")}
        isEditable={true}
        tableMode={tableMode}
        align="center"
        onClick={() => onCellClick(note.id, "bpm")}
        onCommit={(val) => onCellCommit(note.id, "bpm", val)}
        className="text-content-secondary tabular-nums whitespace-nowrap"
        data-testid={`cell-bpm-${note.id}`}
      >
        {note.bpm ?? ""}
      </EditableCell>

      {/* 5. Musical Key (Editable, Centered) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "musical_key")}
        isEditing={isEditingField("musical_key")}
        isEditable={true}
        tableMode={tableMode}
        align="center"
        onClick={() => onCellClick(note.id, "musical_key")}
        onCommit={(val) => onCellCommit(note.id, "musical_key", val)}
        className="text-content-secondary whitespace-nowrap"
        data-testid={`cell-key-${note.id}`}
      >
        {note.musical_key ?? ""}
      </EditableCell>

      {/* 6. Authors (Editable, Centered) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "authors")}
        isEditing={isEditingField("authors")}
        isEditable={true}
        tableMode={tableMode}
        align="center"
        onClick={() => onCellClick(note.id, "authors")}
        onCommit={(val) => onCellCommit(note.id, "authors", val)}
        className="text-content-secondary truncate"
        title={note.authors ?? ""}
        data-testid={`cell-authors-${note.id}`}
      >
        {note.authors ?? ""}
      </EditableCell>

      {/* 7. Section (Editable, Centered) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "song_section")}
        isEditing={isEditingField("song_section")}
        isEditable={true}
        tableMode={tableMode}
        align="center"
        onClick={() => onCellClick(note.id, "song_section")}
        onCommit={(val) => onCellCommit(note.id, "song_section", val)}
        className="text-content-secondary whitespace-nowrap"
        data-testid={`cell-section-${note.id}`}
      >
        {note.song_section ?? ""}
      </EditableCell>

      {/* 8. Instruments (Editable, Left-Aligned) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "instruments")}
        isEditing={isEditingField("instruments")}
        isEditable={true}
        tableMode={tableMode}
        align="center"
        onClick={() => onCellClick(note.id, "instruments")}
        onCommit={(val) => onCellCommit(note.id, "instruments", val)}
        data-testid={`cell-instruments-${note.id}`}
      >
        <div className="flex flex-wrap gap-1 justify-center">
          {note.instruments.map((inst) => (
            <span
              key={inst.id}
              className="inline-block px-2 py-0.5 text-xs rounded-full bg-surface-secondary text-content-secondary border border-border"
            >
              {inst.name}
            </span>
          ))}
        </div>
      </EditableCell>

      {/* 9. Date Created (Non-editable, Centered) */}
      <td className="px-4 py-3 text-center text-content-secondary whitespace-nowrap cursor-default">
        {formatDate(note.created_at)}
      </td>

      {/* 10. Notes (Editable in Edit Mode, Clickable Modal in View Mode, Left-Aligned) */}
      <EditableCell
        value={getNoteFieldDisplayValue(note, "notes")}
        isEditing={isEditingField("notes")}
        isEditable={true}
        tableMode={tableMode}
        align="left"
        isViewClickable={hasNotesContent}
        onViewClick={() => {
          if (hasNotesContent) {
            onNoteClick?.(note);
          }
        }}
        onClick={() => onCellClick(note.id, "notes")}
        onCommit={(val) => onCellCommit(note.id, "notes", val)}
        className="text-content-secondary truncate"
        title={note.notes ?? ""}
        data-testid={`cell-notes-${note.id}`}
      >
        {note.notes ?? ""}
      </EditableCell>

      {/* 11. Action Toggle (Non-editable, Centered) */}
      <td className="px-4 py-3 text-center cursor-default">
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          data-testid={`toggle-note-${note.id}`}
          aria-label={
            note.is_used === 0 ? "Archive this idea" : "Restore this idea"
          }
          title={note.is_used === 0 ? "Archive this idea" : "Restore this idea"}
          className="p-1.5 rounded-md hover:bg-surface-secondary text-content-secondary hover:text-accent transition-colors disabled:opacity-50 cursor-pointer"
        >
          {note.is_used === 0 ? <ArchiveIcon /> : <RestoreIcon />}
        </button>
      </td>
    </tr>
  );
}

function ArchiveIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
