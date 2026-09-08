import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableRow } from '../TableRow';
import type { NoteWithInstruments } from '../../hooks/useNotes';

describe('TableRow', () => {
  const mockNote: NoteWithInstruments = {
    id: 1,
    title: 'Guitar Loop 1',
    file_path: 'recordings/1.wav',
    duration_seconds: 125,
    bpm: 120,
    musical_key: 'D major',
    authors: 'John & Paul',
    song_section: 'Verse',
    notes: 'Rough sketch',
    is_used: 0,
    created_at: '2026-09-08T12:00:00.000Z',
    updated_at: '2026-09-08T12:00:00.000Z',
    instruments: [{ id: 1, name: 'Electric Guitar' }],
  };

  it('renders all cells correctly in view mode', () => {
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            tableMode="view"
            activeCellId={null}
            onCellClick={vi.fn()}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Guitar Loop 1')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('D major')).toBeInTheDocument();
    expect(screen.getByText('John & Paul')).toBeInTheDocument();
    expect(screen.getByText('Verse')).toBeInTheDocument();
    expect(screen.getByText('Electric Guitar')).toBeInTheDocument();
    expect(screen.getByText('Rough sketch')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-note-1')).toBeInTheDocument();
  });

  it('does NOT trigger onCellClick when clicking cells in view mode', () => {
    const onCellClick = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            tableMode="view"
            activeCellId={null}
            onCellClick={onCellClick}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    fireEvent.click(screen.getByText('Guitar Loop 1'));
    fireEvent.click(screen.getByText('120'));
    fireEvent.click(screen.getByText('D major'));

    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('triggers onCellClick when clicking editable cells in edit mode', () => {
    const onCellClick = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            tableMode="edit"
            activeCellId={null}
            onCellClick={onCellClick}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    fireEvent.click(screen.getByTestId('cell-title-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'title');

    fireEvent.click(screen.getByTestId('cell-bpm-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'bpm');

    fireEvent.click(screen.getByTestId('cell-key-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'musical_key');

    fireEvent.click(screen.getByTestId('cell-authors-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'authors');

    fireEvent.click(screen.getByTestId('cell-section-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'song_section');

    fireEvent.click(screen.getByTestId('cell-instruments-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'instruments');

    fireEvent.click(screen.getByTestId('cell-notes-1'));
    expect(onCellClick).toHaveBeenCalledWith(1, 'notes');
  });

  it('does NOT trigger onCellClick for non-editable cells (duration, created, actions)', () => {
    const onCellClick = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            tableMode="edit"
            activeCellId={null}
            onCellClick={onCellClick}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    fireEvent.click(screen.getByText('2:05'));
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('renders input for the actively edited cell and commits on Escape', () => {
    const onCellCommit = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            tableMode="edit"
            activeCellId={{ noteId: 1, field: 'title' }}
            onCellClick={vi.fn()}
            onCellCommit={onCellCommit}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    const input = screen.getByTestId('cell-input') as HTMLInputElement;
    expect(input.value).toBe('Guitar Loop 1');

    fireEvent.change(input, { target: { value: 'Acoustic Intro' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCellCommit).toHaveBeenCalledWith(1, 'title', 'Acoustic Intro');
  });

  it('renders input for the actively edited cell and commits on blur', () => {
    const onCellCommit = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            tableMode="edit"
            activeCellId={{ noteId: 1, field: 'bpm' }}
            onCellClick={vi.fn()}
            onCellCommit={onCellCommit}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    const input = screen.getByTestId('cell-input') as HTMLInputElement;
    expect(input.value).toBe('120');

    fireEvent.change(input, { target: { value: '144' } });
    fireEvent.blur(input);

    expect(onCellCommit).toHaveBeenCalledWith(1, 'bpm', '144');
  });
});
