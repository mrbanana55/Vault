import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterButton } from '../FilterButton';

describe('FilterButton', () => {
  it('renders with accessible tooltip and label', () => {
    render(<FilterButton isFiltered={false} onClick={vi.fn()} />);
    const btn = screen.getByTestId('filter-button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'Filter ideas');
    expect(btn).toHaveAttribute('aria-label', 'Filter ideas');
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<FilterButton isFiltered={false} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('filter-button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays default styling when isFiltered is false', () => {
    render(<FilterButton isFiltered={false} onClick={vi.fn()} />);
    const btn = screen.getByTestId('filter-button');
    expect(btn.className).toContain('text-content-secondary');
    expect(btn.className).not.toContain('bg-accent/10');
  });

  it('displays active styling and highlight when isFiltered is true', () => {
    render(<FilterButton isFiltered={true} onClick={vi.fn()} />);
    const btn = screen.getByTestId('filter-button');
    expect(btn.className).toContain('bg-accent/10');
    expect(btn.className).toContain('text-accent');
    expect(btn.className).toContain('border-accent/40');
  });

  it('handles disabled state properly', () => {
    const handleClick = vi.fn();
    render(<FilterButton isFiltered={false} onClick={handleClick} disabled={true} />);
    const btn = screen.getByTestId('filter-button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
