import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppLayout } from '../AppLayout';
import { ThemeProvider } from '../../context/ThemeContext';

describe('AppLayout', () => {
  const mockNote = {
    id: 1,
    title: 'Guitar Loop',
    file_path: 'recordings/1.wav',
    duration_seconds: 45,
    bpm: 120,
    musical_key: 'C major',
    authors: 'Me',
    song_section: 'Verse',
    notes: 'Sample note',
    is_used: 0 as const,
    created_at: '2026-09-08T12:00:00.000Z',
    updated_at: '2026-09-08T12:00:00.000Z',
    instruments: [{ id: 1, name: 'Guitar' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    window.vaultAPI = {
      notes: {
        create: vi.fn(),
        getAll: vi.fn().mockResolvedValue({
          success: true,
          data: [mockNote],
        }),
        getById: vi.fn().mockResolvedValue({
          success: true,
          data: mockNote,
        }),
        update: vi.fn().mockResolvedValue({
          success: true,
          data: mockNote,
        }),
        delete: vi.fn(),
      },
      instruments: {
        getAll: vi.fn().mockResolvedValue({
          success: true,
          data: [{ id: 1, name: 'Guitar' }],
        }),
      },
      saveAudioFile: vi.fn(),
      getPathForFile: vi.fn(),
      importAudioFile: vi.fn(),
      openFileDialog: vi.fn(),
    } as unknown as typeof window.vaultAPI;
  });

  it('renders with View mode active by default', async () => {
    render(
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    );

    const viewBtn = screen.getByTestId('mode-view');
    const editBtn = screen.getByTestId('mode-edit');

    expect(viewBtn).toHaveAttribute('aria-pressed', 'true');
    expect(editBtn).toHaveAttribute('aria-pressed', 'false');

    await waitFor(() => {
      expect(screen.getByText('Guitar Loop')).toBeInTheDocument();
    });
  });

  it('switches to Edit mode when Edit button is clicked', async () => {
    render(
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Guitar Loop')).toBeInTheDocument();
    });

    const editBtn = screen.getByTestId('mode-edit');
    fireEvent.click(editBtn);

    expect(editBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mode-view')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('edits a cell and persists via IPC in Edit mode', async () => {
    render(
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Guitar Loop')).toBeInTheDocument();
    });

    // Toggle to edit mode
    fireEvent.click(screen.getByTestId('mode-edit'));

    // Click title cell to start edit
    const titleCell = screen.getByTestId('cell-title-1');
    fireEvent.click(titleCell);

    // Find input and type new title
    const input = screen.getByTestId('cell-input') as HTMLInputElement;
    expect(input.value).toBe('Guitar Loop');

    fireEvent.change(input, { target: { value: 'Acoustic Solo' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(window.vaultAPI.notes.update).toHaveBeenCalledWith({
        id: 1,
        title: 'Acoustic Solo',
      });
    });
  });
});
