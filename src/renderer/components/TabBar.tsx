export interface TabBarProps {
  activeTab: 0 | 1;
  onTabChange: (tab: 0 | 1) => void;
}

const TABS = [
  { value: 0 as const, label: "Ideas" },
  { value: 1 as const, label: "Archive" },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Idea status tabs"
      className="inline-flex rounded-lg bg-surface-primary p-1 border border-border"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.value)}
            className={`
              px-4 py-1.5 rounded-md text-xs font-medium transition-all select-none
              ${
                isActive
                  ? "bg-surface-secondary text-content-primary shadow-xs font-semibold"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-hover/50"
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
