import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DragDropOverlay } from '../DragDropOverlay';

describe('DragDropOverlay', () => {
  it('renders nothing when isDragging is false', () => {
    const { container } = render(<DragDropOverlay isDragging={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when isDragging is true', () => {
    render(<DragDropOverlay isDragging={true} />);
    const overlay = screen.getByTestId('drag-drop-overlay');
    expect(overlay).toBeInTheDocument();
    expect(screen.getByText(/drop audio files to import/i)).toBeInTheDocument();
    expect(screen.getByText(/wav, mp3, m4a, ogg, flac/i)).toBeInTheDocument();
  });
});
