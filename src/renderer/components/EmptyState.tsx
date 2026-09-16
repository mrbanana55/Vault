export interface EmptyStateProps {
  isArchive: boolean;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ isArchive, isFiltered, onClearFilters }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div
        data-testid="empty-state"
        className="flex flex-col items-center justify-center h-64 text-content-secondary select-none p-6"
      >
        <div className="text-4xl mb-3 opacity-75">🔍</div>
        <p className="text-sm font-medium text-content-primary mb-1">
          No matching ideas
        </p>
        <p className="text-xs text-content-secondary max-w-sm text-center mb-3">
          No ideas match your current filter criteria. Try adjusting or clearing your filters.
        </p>
        {onClearFilters && (
          <button
            type="button"
            data-testid="empty-clear-filters-button"
            onClick={onClearFilters}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center h-64 text-content-secondary select-none p-6"
    >
      <div className="text-4xl mb-3 opacity-75">
        {isArchive ? '📦' : '🎵'}
      </div>
      <p className="text-sm font-medium text-content-primary mb-1">
        {isArchive ? 'No archived ideas yet' : 'No ideas yet'}
      </p>
      <p className="text-xs text-content-secondary max-w-sm text-center">
        {isArchive
          ? 'Ideas you mark as used will appear in this archive for reference.'
          : 'Record or import your first musical idea to start building your vault.'}
      </p>
    </div>
  );
}
