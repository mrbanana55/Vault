import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdeasTable } from '../IdeasTable';
import type { NoteWithInstruments } from '../../hooks/useNotes';

describe('IdeasTable', () => {
  const mockNotes: NoteWithInstruments[] = [
    {
      id: 1,
      title: 'First Idea',
      file_path: 'recordings/1.wav',
      duration_seconds: 60,
      bpm: 100,
      musical_key: 'C major',
      authors: 'Author 1',
      song_section: 'Intro',
      notes: 'Initial take',
      is_used: 0,
      created_at: '2026-09-08T12:00:00.000Z',
      updated_at: '2026-09-08T12:00:00.000Z',
      instruments: [{ id: 1, name: 'Piano' }],
    },
    {
      id: 2,
      title: 'Second Idea',
      file_path: 'recordings/2.wav',
      duration_seconds: 90,
      bpm: 140,
      musical_key: 'E minor',
      authors: 'Author 2',
      song_section: 'Chorus',
      notes: 'Loud chorus',
      is_used: 0,
      created_at: '2026-09-08T12:01:00.000Z',
      updated_at: '2026-09-08T12:01:00.000Z',
      instruments: [{ id: 2, name: 'Drums' }],
    },
  ];

  it('renders loading state when loading is true', () => {
    render(
      <IdeasTable
        isUsed={0}
        notes={[]}
        loading={true}
        error={null}
        onRefetch={vi.fn()}
        tableMode="view"
        activeCellId={null}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('renders error state when error is present', () => {
    const onRefetch = vi.fn();
    render(
      <IdeasTable
        isUsed={0}
        notes={[]}
        loading={false}
        error="Network error"
        onRefetch={onRefetch}
        tableMode="view"
        activeCellId={null}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    expect(screen.getByTestId('table-error')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when notes array is empty', () => {
    render(
      <IdeasTable
        isUsed={0}
        notes={[]}
        loading={false}
        error={null}
        onRefetch={vi.fn()}
        tableMode="view"
        activeCellId={null}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    expect(screen.getByText('No ideas yet')).toBeInTheDocument();
  });

  it('renders rows for each note', () => {
    render(
      <IdeasTable
        isUsed={0}
        notes={mockNotes}
        loading={false}
        error={null}
        onRefetch={vi.fn()}
        tableMode="view"
        activeCellId={null}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    expect(screen.getByText('First Idea')).toBeInTheDocument();
    expect(screen.getByText('Second Idea')).toBeInTheDocument();
  });

  it('renders table with table-fixed, min-width, and centered headers', () => {
    render(
      <IdeasTable
        isUsed={0}
        notes={mockNotes}
        loading={false}
        error={null}
        onRefetch={vi.fn()}
        tableMode="view"
        activeCellId={null}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    const table = screen.getByRole('table');
    expect(table.className).toContain('table-fixed');
    expect(table.className).toContain('min-w-[1100px]');

    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBe(12);

    // All headers must be centered and have cursor-default select-none
    headers.forEach((th) => {
      expect(th.className).toContain('text-center');
      expect(th.className).toContain('cursor-default');
      expect(th.className).toContain('select-none');
    });

    // Check specific width classes
    expect(headers[0].className).toContain('w-10'); // Checkbox
    expect(headers[1].className).toContain('w-10'); // Play
    expect(headers[2].className).toContain('w-[18%]'); // Title
    expect(headers[3].className).toContain('w-[8%]'); // Duration
    expect(headers[4].className).toContain('w-[7%]'); // BPM
    expect(headers[5].className).toContain('w-[7%]'); // Key
    expect(headers[6].className).toContain('w-[13%]'); // Authors
    expect(headers[7].className).toContain('w-[9%]'); // Section
    expect(headers[8].className).toContain('w-[15%]'); // Instruments
    expect(headers[9].className).toContain('w-[10%]'); // Created
    expect(headers[10].className).toContain('w-[15%]'); // Notes
    expect(headers[11].className).toContain('w-12'); // Action
  });

  it('renders informative tooltips on column headers', () => {
    render(
      <IdeasTable
        isUsed={0}
        notes={mockNotes}
        loading={false}
        error={null}
        onRefetch={vi.fn()}
        tableMode="view"
        activeCellId={null}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers[2]).toHaveAttribute('title', 'Name or identifier of the audio idea.');
    expect(headers[3]).toHaveAttribute('title', 'Total audio length in mm:ss format.');
    expect(headers[4]).toHaveAttribute('title', 'Beats per minute tempo (positive numeric value).');
    expect(headers[5]).toHaveAttribute('title', 'Musical key signature (e.g., C maj, A min, F#).');
    expect(headers[6]).toHaveAttribute(
      'title',
      'Songwriters and performers. In edit mode, separate multiple authors with commas.'
    );
    expect(headers[7]).toHaveAttribute(
      'title',
      'Song structure section (e.g., Intro, Verse, Chorus, Bridge, Outro).'
    );
    expect(headers[8]).toHaveAttribute(
      'title',
      'Musical instruments tagged on this idea. In edit mode, separate multiple instruments with commas.'
    );
    expect(headers[9]).toHaveAttribute(
      'title',
      'Date and time the audio idea was recorded or imported.'
    );
    expect(headers[10]).toHaveAttribute(
      'title',
      'Production notes, lyrics, chords, or reminders. Click in view mode to read full text.'
    );
  });

  it('delegates row selection callbacks to TableRow checkboxes', () => {
    const onRowSelect = vi.fn();
    const selectedIds = new Set([1]);

    render(
      <IdeasTable
        isUsed={0}
        notes={mockNotes}
        loading={false}
        error={null}
        onRefetch={vi.fn()}
        tableMode="view"
        activeCellId={null}
        selectedIds={selectedIds}
        onRowSelect={onRowSelect}
        onCellClick={vi.fn()}
        onCellCommit={vi.fn()}
      />
    );

    const checkbox1 = screen.getByTestId('row-checkbox-1');
    const checkbox2 = screen.getByTestId('row-checkbox-2');

    expect(checkbox1).toBeChecked();
    expect(checkbox2).not.toBeChecked();

    fireEvent.click(checkbox2);
    expect(onRowSelect).toHaveBeenCalledWith(2, 1, false);
  });
});
