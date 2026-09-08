import { useState, useEffect, useRef } from 'react';
import type { TableMode } from '../types/inline-edit';

export interface EditableCellProps {
  value: string;
  isEditing: boolean;
  isEditable: boolean;
  tableMode: TableMode;
  onClick?: () => void;
  onCommit: (newValue: string) => void;
  className?: string;
  title?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

export function EditableCell({
  value,
  isEditing,
  isEditable,
  tableMode,
  onClick,
  onCommit,
  className = '',
  title,
  children,
  'data-testid': testId,
}: EditableCellProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setInputValue(value);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, value]);

  if (isEditing) {
    return (
      <td
        data-testid={testId ?? 'editable-cell-input'}
        className={`px-4 py-3 bg-surface-hover/30 ring-1 ring-accent/50 rounded ${className}`}
      >
        <input
          ref={inputRef}
          type="text"
          data-testid="cell-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => onCommit(inputValue)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.blur();
            }
          }}
          className="w-full text-xs bg-transparent border-0 outline-none ring-0 text-content-primary py-0"
        />
      </td>
    );
  }

  const isClickable = isEditable && tableMode === 'edit';

  const cellClasses = isClickable
    ? `px-4 py-3 cursor-text hover:bg-surface-hover/50 transition-colors ${className}`
    : `px-4 py-3 ${className}`;

  return (
    <td
      data-testid={testId ?? (isClickable ? 'editable-cell' : undefined)}
      className={cellClasses}
      title={title}
      onClick={isClickable ? onClick : undefined}
    >
      {children}
    </td>
  );
}
