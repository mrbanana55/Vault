import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('displays the active ideas empty message when isArchive is false', () => {
    render(<EmptyState isArchive={false} />);
    expect(screen.getByText(/No ideas yet/i)).toBeInTheDocument();
  });

  it('displays the archive empty message when isArchive is true', () => {
    render(<EmptyState isArchive={true} />);
    expect(screen.getByText(/No archived ideas yet/i)).toBeInTheDocument();
  });

  it('displays the filtered empty message when isFiltered is true', () => {
    render(<EmptyState isArchive={false} isFiltered={true} />);
    expect(screen.getByText(/No matching ideas/i)).toBeInTheDocument();
    expect(screen.getByText(/No ideas match your current filter criteria/i)).toBeInTheDocument();
  });

  it('triggers onClearFilters callback when Clear Filters button is clicked', () => {
    const handleClear = vi.fn();
    render(<EmptyState isArchive={false} isFiltered={true} onClearFilters={handleClear} />);
    const clearBtn = screen.getByTestId('empty-clear-filters-button');
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
