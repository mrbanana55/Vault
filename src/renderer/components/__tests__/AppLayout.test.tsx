import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppLayout } from '../AppLayout';
import { ThemeProvider } from '../../context/ThemeContext';

const mockPause = vi.fn();
let mockAudioPlayerState = {
  currentNote: null as any,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: vi.fn(),
  pause: mockPause,
  togglePlay: vi.fn(),
  seek: vi.fn(),
  error: null,
};

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => mockAudioPlayerState,
}));

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

  const mockArchivedNote = {
    id: 2,
    title: 'Archived Idea',
    file_path: 'recordings/2.wav',
    duration_seconds: 60,
    bpm: 130,
    musical_key: 'A minor',
    authors: 'Me',
    song_section: 'Chorus',
    notes: 'Archived note',
    is_used: 1 as const,
    created_at: '2026-09-08T13:00:00.000Z',
    updated_at: '2026-09-08T13:00:00.000Z',
    instruments: [{ id: 1, name: 'Guitar' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioPlayerState = {
      currentNote: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      play: vi.fn(),
      pause: mockPause,
      togglePlay: vi.fn(),
      seek: vi.fn(),
      error: null,
    };

    window.vaultAPI = {
      notes: {
        create: vi.fn(),
        getAll: vi.fn().mockImplementation((filter?: { is_used?: number }) => {
          if (filter?.is_used === 1) {
            return Promise.resolve({ success: true, data: [mockArchivedNote] });
          }
          return Promise.resolve({ success: true, data: [mockNote] });
        }),
        getById: vi.fn().mockImplementation((id: number) => {
          if (id === 2) return Promise.resolve({ success: true, data: mockArchivedNote });
          return Promise.resolve({ success: true, data: mockNote });
        }),
        update: vi.fn().mockResolvedValue({
          success: true,
          data: mockNote,
        }),
        delete: vi.fn().mockResolvedValue({
          success: true,
          data: { file_missing: false },
        }),
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

  it('resets selection when switching tabs between Ideas and Archive', async () => {
    render(
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Guitar Loop')).toBeInTheDocument();
    });

    // Select idea 1
    const checkbox = screen.getByTestId('row-checkbox-1');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Switch to Archive tab
    const archiveTab = screen.getByRole('tab', { name: /Archive/i });
    fireEvent.click(archiveTab);

    await waitFor(() => {
      expect(screen.getByText('Archived Idea')).toBeInTheDocument();
    });

    // Verify archived row is NOT selected
    const archiveCheckbox = screen.getByTestId('row-checkbox-2');
    expect(archiveCheckbox).not.toBeChecked();

    // Switch back to Ideas tab
    const ideasTab = screen.getByRole('tab', { name: /Ideas/i });
    fireEvent.click(ideasTab);

    await waitFor(() => {
      expect(screen.getByText('Guitar Loop')).toBeInTheDocument();
    });

    // Verify previous selection was reset upon leaving the tab
    const restoredCheckbox = screen.getByTestId('row-checkbox-1');
    expect(restoredCheckbox).not.toBeChecked();
  });

  it('triggers delete confirmation modal and executes deletion via vaultAPI', async () => {
    mockAudioPlayerState.currentNote = mockNote;

    render(
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Guitar Loop')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-button');
    expect(deleteBtn).toBeDisabled();

    // Select idea 1
    fireEvent.click(screen.getByTestId('row-checkbox-1'));
    expect(deleteBtn).not.toBeDisabled();
    expect(screen.getByTestId('delete-count-badge')).toHaveTextContent('1');

    // Click delete button -> modal opens
    fireEvent.click(deleteBtn);
    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();

    // Click Cancel -> modal closes, no delete called
    fireEvent.click(screen.getByTestId('delete-cancel-button'));
    expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
    expect(window.vaultAPI.notes.delete).not.toHaveBeenCalled();

    // Reopen modal and click Accept
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId('delete-accept-button'));

    await waitFor(() => {
      expect(mockPause).toHaveBeenCalledTimes(1);
      expect(window.vaultAPI.notes.delete).toHaveBeenCalledWith(1);
      expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
    });
  });
});
