import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../TabBar';

describe('TabBar', () => {
  it('renders both Ideas and Archive tabs', () => {
    render(<TabBar activeTab={0} onTabChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /archive/i })).toBeInTheDocument();
  });

  it('indicates active tab with aria-selected', () => {
    const { rerender } = render(<TabBar activeTab={0} onTabChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /ideas/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /archive/i })).toHaveAttribute('aria-selected', 'false');

    rerender(<TabBar activeTab={1} onTabChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /ideas/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /archive/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('triggers onTabChange(1) when clicking Archive', () => {
    const handleTabChange = vi.fn();
    render(<TabBar activeTab={0} onTabChange={handleTabChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /archive/i }));
    expect(handleTabChange).toHaveBeenCalledWith(1);
  });

  it('triggers onTabChange(0) when clicking Ideas', () => {
    const handleTabChange = vi.fn();
    render(<TabBar activeTab={1} onTabChange={handleTabChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /ideas/i }));
    expect(handleTabChange).toHaveBeenCalledWith(0);
  });
});
