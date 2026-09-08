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

  it('triggers onClick when clicked in edit mode for editable cell', () => {
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
    fireEvent.click(cell);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger onClick in view mode', () => {
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
    if (cell) {
      fireEvent.click(cell);
    }
    expect(handleClick).not.toHaveBeenCalled();
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
