import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditableCell } from '../EditableCell';

describe('EditableCell', () => {
  it('renders children inside td when not editing', () => {
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="Original Title"
              isEditing={false}
              isEditable={true}
              tableMode="view"
              onCommit={vi.fn()}
            >
              <span>Original Title</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText('Original Title')).toBeInTheDocument();
    expect(screen.queryByTestId('cell-input')).not.toBeInTheDocument();
  });

  it('applies cursor-pointer and triggers onClick when clicked in edit mode for editable cell', () => {
    const handleClick = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="Original Title"
              isEditing={false}
              isEditable={true}
              tableMode="edit"
              onClick={handleClick}
              onCommit={vi.fn()}
            >
              <span>Original Title</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const cell = screen.getByTestId('editable-cell');
    expect(cell.className).toContain('cursor-pointer');
    expect(cell.className).not.toContain('cursor-text');

    fireEvent.click(cell);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies cursor-default and does NOT trigger onClick in view mode when isViewClickable is false', () => {
    const handleClick = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="Original Title"
              isEditing={false}
              isEditable={true}
              tableMode="view"
              onClick={handleClick}
              onCommit={vi.fn()}
            >
              <span>Original Title</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const cell = screen.getByText('Original Title').closest('td');
    expect(cell?.className).toContain('cursor-default');
    expect(cell?.className).not.toContain('cursor-pointer');

    if (cell) {
      fireEvent.click(cell);
    }
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies cursor-pointer and calls onViewClick in view mode when isViewClickable is true', () => {
    const handleViewClick = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="Some notes"
              isEditing={false}
              isEditable={true}
              tableMode="view"
              isViewClickable={true}
              onViewClick={handleViewClick}
              onCommit={vi.fn()}
            >
              <span>Some notes</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const cell = screen.getByTestId('editable-cell');
    expect(cell.className).toContain('cursor-pointer');

    fireEvent.click(cell);
    expect(handleViewClick).toHaveBeenCalledTimes(1);
  });

  it('applies alignment classes correctly in display and editing modes', () => {
    const { rerender } = render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="120"
              isEditing={false}
              isEditable={true}
              tableMode="view"
              align="center"
              onCommit={vi.fn()}
            >
              <span>120</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const cell = screen.getByText('120').closest('td');
    expect(cell?.className).toContain('text-center');

    rerender(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="120"
              isEditing={true}
              isEditable={true}
              tableMode="edit"
              align="center"
              onCommit={vi.fn()}
            >
              <span>120</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const input = screen.getByTestId('cell-input');
    expect(input.className).toContain('text-center');
    expect(input.className).toContain('w-full');
    expect(input.className).toContain('min-w-0');
  });

  it('renders input with value and commits on blur', () => {
    const handleCommit = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="Initial Value"
              isEditing={true}
              isEditable={true}
              tableMode="edit"
              onCommit={handleCommit}
            >
              <span>Initial Value</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const input = screen.getByTestId('cell-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Initial Value');

    fireEvent.change(input, { target: { value: 'Updated Value' } });
    fireEvent.blur(input);

    expect(handleCommit).toHaveBeenCalledWith('Updated Value');
  });

  it('commits on Escape key', () => {
    const handleCommit = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <EditableCell
              value="Initial Value"
              isEditing={true}
              isEditable={true}
              tableMode="edit"
              onCommit={handleCommit}
            >
              <span>Initial Value</span>
            </EditableCell>
          </tr>
        </tbody>
      </table>
    );

    const input = screen.getByTestId('cell-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Saved with Esc' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(handleCommit).toHaveBeenCalledWith('Saved with Esc');
  });
});
