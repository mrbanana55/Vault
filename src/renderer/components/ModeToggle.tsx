import type { TableMode } from '../types/inline-edit';

export interface ModeToggleProps {
  tableMode: TableMode;
  onModeChange: (mode: TableMode) => void;
}

export function ModeToggle({ tableMode, onModeChange }: ModeToggleProps) {
  return (
    <div
      data-testid="mode-toggle"
      className="inline-flex rounded-lg bg-surface-secondary border border-border p-0.5 gap-0.5"
      role="group"
      aria-label="Table display mode"
    >
      <button
        type="button"
        data-testid="mode-view"
        aria-pressed={tableMode === 'view'}
        onClick={() => onModeChange('view')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          tableMode === 'view'
            ? 'bg-surface-primary text-content-primary shadow-sm'
            : 'text-content-secondary hover:text-content-primary'
        }`}
      >
        View
      </button>
      <button
        type="button"
        data-testid="mode-edit"
        aria-pressed={tableMode === 'edit'}
        onClick={() => onModeChange('edit')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          tableMode === 'edit'
            ? 'bg-surface-primary text-content-primary shadow-sm'
            : 'text-content-secondary hover:text-content-primary'
        }`}
      >
        Edit
      </button>
    </div>
  );
}
