export interface ClearFiltersButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ClearFiltersButton({
  onClick,
  disabled = false,
}: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      data-testid="clear-filters-button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label="Clear all filters"
      title="Clear all filters"
      className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-medium transition-all select-none border border-border shadow-xs bg-surface-primary text-content-secondary hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer active:scale-95"
    >
      <CloseIcon />
    </button>
  );
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
