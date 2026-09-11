import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';

describe('DeleteConfirmationModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteConfirmationModal
        isOpen={false}
        count={1}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByTestId('delete-confirmation-modal')).not.toBeInTheDocument();
  });

  it('renders correctly with warning text when isOpen is true', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        count={2}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
    expect(screen.getByText(/Once deleted, the audio cannot be recovered/i)).toBeInTheDocument();
    expect(screen.getByText(/these 2 audio ideas/i)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        count={1}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByTestId('delete-cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Accept button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        count={1}
        isDeleting={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('delete-accept-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(
      <DeleteConfirmationModal
        isOpen={true}
        count={1}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
