import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header
      data-testid="app-header"
      className="h-13 border-b border-border bg-surface-primary flex items-center justify-between px-6 shrink-0 transition-colors select-none"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base font-bold tracking-tight text-content-primary">
          Vault
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary text-content-secondary border border-border/70 font-medium">
          Music Ideas
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
