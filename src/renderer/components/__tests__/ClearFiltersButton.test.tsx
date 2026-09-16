import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClearFiltersButton } from '../ClearFiltersButton';

describe('ClearFiltersButton', () => {
  it('renders with accessible tooltip and aria-label', () => {
    render(<ClearFiltersButton onClick={vi.fn()} />);
    const btn = screen.getByTestId('clear-filters-button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'Clear all filters');
    expect(btn).toHaveAttribute('aria-label', 'Clear all filters');
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<ClearFiltersButton onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('clear-filters-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
