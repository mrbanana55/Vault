export interface FilterButtonProps {
  isFiltered: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function FilterButton({
  isFiltered,
  onClick,
  disabled = false,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      data-testid="filter-button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label="Filter ideas"
      title="Filter ideas"
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none
        border shadow-xs
        ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-surface-primary text-content-secondary border-border"
            : isFiltered
              ? "border-accent bg-accent/10 text-accent font-semibold cursor-pointer active:scale-95"
              : "border-border bg-surface-primary text-content-secondary hover:text-content-primary hover:bg-surface-hover cursor-pointer active:scale-95"
        }
      `}
    >
      <FilterIcon />
      <span>Filter</span>
      {isFiltered && (
        <span
          data-testid="filter-active-dot"
          className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
        />
      )}
    </button>
  );
}

function FilterIcon() {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
