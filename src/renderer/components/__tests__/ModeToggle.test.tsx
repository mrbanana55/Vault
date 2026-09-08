import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '../ModeToggle';

describe('ModeToggle', () => {
  it('renders View and Edit buttons with appropriate aria-pressed states', () => {
    const onModeChange = vi.fn();
    render(<ModeToggle tableMode="view" onModeChange={onModeChange} />);

    const viewBtn = screen.getByTestId('mode-view');
    const editBtn = screen.getByTestId('mode-edit');

    expect(viewBtn).toHaveAttribute('aria-pressed', 'true');
    expect(editBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onModeChange with "edit" when Edit button is clicked', () => {
    const onModeChange = vi.fn();
    render(<ModeToggle tableMode="view" onModeChange={onModeChange} />);

    const editBtn = screen.getByTestId('mode-edit');
    fireEvent.click(editBtn);

    expect(onModeChange).toHaveBeenCalledWith('edit');
  });

  it('calls onModeChange with "view" when View button is clicked', () => {
    const onModeChange = vi.fn();
    render(<ModeToggle tableMode="edit" onModeChange={onModeChange} />);

    const viewBtn = screen.getByTestId('mode-view');
    fireEvent.click(viewBtn);

    expect(onModeChange).toHaveBeenCalledWith('view');
  });
});
