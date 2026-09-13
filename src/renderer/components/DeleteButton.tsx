export interface DeleteButtonProps {
  selectedCount: number;
  onClick: () => void;
  disabled?: boolean;
}

export function DeleteButton({
  selectedCount,
  onClick,
  disabled = false,
}: DeleteButtonProps) {
  const isDisabled = disabled || selectedCount === 0;

  return (
    <button
      type="button"
      data-testid="delete-button"
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={
        selectedCount > 0
          ? `Delete ${selectedCount} selected ${selectedCount === 1 ? 'idea' : 'ideas'}`
          : 'Delete selected ideas'
      }
      title={selectedCount > 0 ? `Delete (${selectedCount})` : 'Select ideas to delete'}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none
        border border-border shadow-xs
        ${
          isDisabled
            ? 'opacity-40 cursor-not-allowed bg-surface-primary text-content-secondary'
            : 'bg-surface-primary text-content-secondary hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer active:scale-95'
        }
      `}
    >
      <TrashIcon />
      {selectedCount > 0 && (
        <span
          data-testid="delete-count-badge"
          className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 dark:text-red-400"
        >
          {selectedCount}
        </span>
      )}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
