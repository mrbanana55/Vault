import React, { useState, useEffect, useRef } from "react";
import type { TableMode } from "../types/inline-edit";

export interface EditableCellProps {
  value: string;
  isEditing: boolean;
  isEditable: boolean;
  tableMode: TableMode;
  align?: "left" | "center";
  isViewClickable?: boolean;
  onViewClick?: () => void;
  onClick?: () => void;
  onCommit: (newValue: string) => void;
  className?: string;
  title?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}

export function EditableCell({
  value,
  isEditing,
  isEditable,
  tableMode,
  align = "left",
  isViewClickable = false,
  onViewClick,
  onClick,
  onCommit,
  className = "",
  title,
  children,
  "data-testid": testId,
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

  const alignClass = align === "center" ? "text-center" : "text-left";

  if (isEditing) {
    return (
      <td
        data-testid={testId ?? "editable-cell-input"}
        className={`px-4 py-3 bg-surface-hover/30 ${alignClass} ${className}`}
      >
        <input
          ref={inputRef}
          type="text"
          data-testid="cell-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => onCommit(inputValue)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.blur();
            }
          }}
          className={`w-full min-w-0 box-border text-xs bg-transparent border-0 outline-none ring-0 text-content-primary py-0 ${alignClass}`}
        />
      </td>
    );
  }

  const isEditClickable = isEditable && tableMode === "edit";
  const isViewClickAction = tableMode === "view" && isViewClickable;

  let cursorClasses = "cursor-default";
  let clickHandler: (() => void) | undefined = undefined;

  if (isEditClickable) {
    cursorClasses =
      "cursor-pointer hover:bg-surface-hover/50 transition-colors";
    clickHandler = onClick;
  } else if (isViewClickAction) {
    cursorClasses =
      "cursor-pointer hover:bg-surface-hover/40 transition-colors";
    clickHandler = onViewClick;
  }

  const cellClasses = `px-4 py-3 ${cursorClasses} ${alignClass} ${className}`;

  return (
    <td
      data-testid={
        testId ??
        (isEditClickable || isViewClickAction ? "editable-cell" : undefined)
      }
      className={cellClasses}
      title={title}
      onClick={clickHandler}
    >
      {children}
    </td>
  );
}
