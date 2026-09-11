import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteButton } from '../DeleteButton';

describe('DeleteButton', () => {
  it('renders disabled state when selectedCount is 0', () => {
    const onClick = vi.fn();
    render(<DeleteButton selectedCount={0} onClick={onClick} />);

    const button = screen.getByTestId('delete-button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button.className).toContain('opacity-40');
    expect(button.className).toContain('cursor-not-allowed');

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders enabled state with count badge when selectedCount > 0', () => {
    const onClick = vi.fn();
    render(<DeleteButton selectedCount={3} onClick={onClick} />);

    const button = screen.getByTestId('delete-button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Delete 3 selected ideas');
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
