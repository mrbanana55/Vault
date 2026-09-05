interface EmptyStateProps {
  isArchive: boolean;
}

export function EmptyState({ isArchive }: EmptyStateProps) {
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
