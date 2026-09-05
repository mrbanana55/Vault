export function RecordingPanel() {
  return (
    <footer
      data-testid="recording-panel"
      className="h-16 border-t border-border bg-surface-primary flex items-center justify-center px-6 shrink-0 transition-colors"
    >
      <div className="flex items-center gap-2 text-content-secondary text-xs select-none">
        <span className="inline-block w-2 h-2 rounded-full bg-content-secondary/40" />
        <span>Recording panel — coming soon</span>
      </div>
    </footer>
  );
}
