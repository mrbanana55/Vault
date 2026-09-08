import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CircularProgressModal } from '../CircularProgressModal';

describe('CircularProgressModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CircularProgressModal
        isOpen={false}
        progressPercentage={0}
        totalFiles={1}
        currentIndex={0}
        isComplete={false}
        onDismiss={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders progress percentage and current file name when open', () => {
    render(
      <CircularProgressModal
        isOpen={true}
        progressPercentage={65}
        totalFiles={4}
        currentIndex={3}
        currentFileName="bassline.wav"
        isComplete={false}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByTestId('circular-progress-modal')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('bassline.wav')).toBeInTheDocument();
    expect(screen.getByText(/importing 3 of 4 ideas/i)).toBeInTheDocument();
  });

  it('renders completion state and triggers onDismiss when Done is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <CircularProgressModal
        isOpen={true}
        progressPercentage={100}
        totalFiles={2}
        currentIndex={2}
        isComplete={true}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('displays errors if any files failed', () => {
    render(
      <CircularProgressModal
        isOpen={true}
        progressPercentage={100}
        totalFiles={2}
        currentIndex={2}
        isComplete={true}
        errors={[{ filename: 'bad.txt', error: 'Unsupported format' }]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/bad\.txt/)).toBeInTheDocument();
    expect(screen.getByText(/unsupported format/i)).toBeInTheDocument();
  });
});
