import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableRow } from '../TableRow';
import type { NoteWithInstruments } from '../../hooks/useNotes';

const mockTogglePlay = vi.fn();
let mockAudioPlayerState = {
  currentNote: null as NoteWithInstruments | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: vi.fn(),
  pause: vi.fn(),
  togglePlay: mockTogglePlay,
  seek: vi.fn(),
  error: null,
};

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => mockAudioPlayerState,
}));

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

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioPlayerState = {
      currentNote: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      play: vi.fn(),
      pause: vi.fn(),
      togglePlay: mockTogglePlay,
      seek: vi.fn(),
      error: null,
    };
  });

  it('renders all cells correctly including selection checkbox', () => {
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            index={0}
            tableMode="view"
            activeCellId={null}
            onCellClick={vi.fn()}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('row-checkbox-1')).toBeInTheDocument();
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

  it('handles checkbox selection click and calls onSelect with shiftKey state', () => {
    const onSelect = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            index={2}
            tableMode="view"
            activeCellId={null}
            isSelected={false}
            onSelect={onSelect}
            onCellClick={vi.fn()}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    const checkbox = screen.getByTestId('row-checkbox-1');
    expect(checkbox).not.toBeChecked();

    // Normal click
    fireEvent.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith(1, 2, false);

    // Shift click
    fireEvent.click(checkbox, { shiftKey: true });
    expect(onSelect).toHaveBeenCalledWith(1, 2, true);
  });

  it('applies selected row styling when isSelected is true', () => {
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            index={0}
            tableMode="view"
            activeCellId={null}
            isSelected={true}
            onCellClick={vi.fn()}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    const checkbox = screen.getByTestId('row-checkbox-1');
    expect(checkbox).toBeChecked();

    const row = screen.getByTestId('note-row-1');
    expect(row.className).toContain('bg-surface-secondary/50');
  });

  it('does NOT trigger onCellClick when clicking cells in view mode', () => {
    const onCellClick = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            index={0}
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
            index={0}
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
            index={0}
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
            index={0}
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
            index={0}
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

  it('renders play button in column 1 and calls togglePlay when clicked', () => {
    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            index={0}
            tableMode="view"
            activeCellId={null}
            onCellClick={vi.fn()}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    const playBtn = screen.getByTestId('row-play-button-1');
    expect(playBtn).toBeInTheDocument();
    expect(playBtn).toHaveAttribute('aria-label', 'Play Guitar Loop 1');

    fireEvent.click(playBtn);
    expect(mockTogglePlay).toHaveBeenCalledWith(mockNote);
  });

  it('renders pause button and active styling when note is currently playing', () => {
    mockAudioPlayerState.currentNote = mockNote;
    mockAudioPlayerState.isPlaying = true;

    render(
      <table>
        <tbody>
          <TableRow
            note={mockNote}
            index={0}
            tableMode="view"
            activeCellId={null}
            onCellClick={vi.fn()}
            onCellCommit={vi.fn()}
            onToggle={vi.fn()}
          />
        </tbody>
      </table>
    );

    const playBtn = screen.getByTestId('row-play-button-1');
    expect(playBtn).toHaveAttribute('aria-label', 'Pause Guitar Loop 1');

    const row = screen.getByTestId('note-row-1');
    expect(row.className).toContain('bg-surface-secondary');
  });
});
