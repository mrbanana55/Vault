import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
