import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteReaderModal } from '../NoteReaderModal';

describe('NoteReaderModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <NoteReaderModal
        isOpen={false}
        title="idea-1"
        notes="Some notes"
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId('note-reader-modal')).not.toBeInTheDocument();
  });

  it('renders title and note content when isOpen is true', () => {
    render(
      <NoteReaderModal
        isOpen={true}
        title="My Guitar Riff"
        notes="Acoustic intro with fingerpicking in D minor."
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('note-reader-modal')).toBeInTheDocument();
    expect(screen.getByText('My Guitar Riff')).toBeInTheDocument();
    expect(screen.getByText('Acoustic intro with fingerpicking in D minor.')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    const handleClose = vi.fn();
    render(
      <NoteReaderModal
        isOpen={true}
        title="idea-1"
        notes="Notes content"
        onClose={handleClose}
      />
    );

    const closeButton = screen.getByTestId('note-reader-close-button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing the Escape key', () => {
    const handleClose = vi.fn();
    render(
      <NoteReaderModal
        isOpen={true}
        title="idea-1"
        notes="Notes content"
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop, but not when clicking inside dialog', () => {
    const handleClose = vi.fn();
    render(
      <NoteReaderModal
        isOpen={true}
        title="idea-1"
        notes="Notes content"
        onClose={handleClose}
      />
    );

    const backdrop = screen.getByTestId('note-reader-modal');
    // Clicking backdrop
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Clicking inside dialog card
    const card = screen.getByTestId('note-reader-card');
    fireEvent.click(card);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
