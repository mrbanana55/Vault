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

  it('renders table headers including selection checkbox and play columns', () => {
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
    expect(headers.length).toBe(12); // 1 checkbox + 1 play + 9 metadata + 1 action
    expect(headers[0].textContent).toBe('');
    expect(headers[1].textContent).toBe('');
    expect(headers[2].textContent).toBe('Title');
    expect(headers[3].textContent).toBe('Duration');
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
