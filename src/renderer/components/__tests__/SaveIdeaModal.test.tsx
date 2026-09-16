import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveIdeaModal } from '../SaveIdeaModal';

describe('SaveIdeaModal (US1, US4)', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SaveIdeaModal
        isOpen={false}
        durationSeconds={12.4}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with formatted duration and all input fields when isOpen is true', () => {
    render(
      <SaveIdeaModal
        isOpen={true}
        durationSeconds={65}
        onSave={vi.fn()}
        onDiscard={vi.fn()}
      />
    );

    expect(screen.getByTestId('save-idea-modal')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByTestId('input-title')).toBeInTheDocument();
    expect(screen.getByTestId('input-key')).toBeInTheDocument();
    expect(screen.getByTestId('input-bpm')).toBeInTheDocument();
    expect(screen.getByTestId('input-authors')).toBeInTheDocument();
    expect(screen.getByTestId('input-section')).toBeInTheDocument();
    expect(screen.getByTestId('input-instruments')).toBeInTheDocument();
    expect(screen.getByTestId('input-notes')).toBeInTheDocument();
    expect(screen.getByTestId('btn-save-idea')).toBeInTheDocument();
    expect(screen.getByTestId('btn-discard')).toBeInTheDocument();
  });

  it('submits empty fields gracefully for default Idea-XX generation', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SaveIdeaModal
        isOpen={true}
        durationSeconds={10}
        onSave={onSave}
        onDiscard={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-save-idea'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: '',
        musical_key: undefined,
        bpm: null,
        authors: undefined,
        song_section: undefined,
        instruments: undefined,
        notes: undefined,
      });
    });
  });

  it('submits entered metadata correctly', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <SaveIdeaModal
        isOpen={true}
        durationSeconds={15}
        onSave={onSave}
        onDiscard={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'Chorus Riff' } });
    fireEvent.change(screen.getByTestId('input-key'), { target: { value: 'G Major' } });
    fireEvent.change(screen.getByTestId('input-bpm'), { target: { value: '128' } });
    fireEvent.change(screen.getByTestId('input-authors'), { target: { value: 'Alice, Bob' } });
    fireEvent.change(screen.getByTestId('input-section'), { target: { value: 'Chorus' } });
    fireEvent.change(screen.getByTestId('input-instruments'), { target: { value: 'Guitar, Bass' } });
    fireEvent.change(screen.getByTestId('input-notes'), { target: { value: 'Recorded on dynamic mic' } });

    fireEvent.click(screen.getByTestId('btn-save-idea'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: 'Chorus Riff',
        musical_key: 'G Major',
        bpm: 128,
        authors: 'Alice, Bob',
        song_section: 'Chorus',
        instruments: 'Guitar, Bass',
        notes: 'Recorded on dynamic mic',
      });
    });
  });

  it('requires explicit confirmation to discard take (US4)', () => {
    const onDiscard = vi.fn();
    render(
      <SaveIdeaModal
        isOpen={true}
        durationSeconds={10}
        onSave={vi.fn()}
        onDiscard={onDiscard}
      />
    );

    expect(screen.queryByTestId('discard-confirm-banner')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('btn-discard'));

    expect(screen.getByTestId('discard-confirm-banner')).toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();

    // Cancel discard
    fireEvent.click(screen.getByTestId('btn-cancel-discard'));
    expect(screen.queryByTestId('discard-confirm-banner')).not.toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();

    // Re-open and confirm discard
    fireEvent.click(screen.getByTestId('btn-discard'));
    fireEvent.click(screen.getByTestId('btn-confirm-discard'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
