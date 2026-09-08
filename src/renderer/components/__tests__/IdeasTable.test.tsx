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
});
