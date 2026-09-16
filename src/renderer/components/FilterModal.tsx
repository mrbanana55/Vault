import { useState, useEffect } from 'react';
import type { IdeaFilterCriteria } from '../types/filters';
import { FILTER_TOOLTIPS } from '../types/filters';

export interface FilterModalProps {
  isOpen: boolean;
  initialCriteria: IdeaFilterCriteria;
  onApply: (criteria: IdeaFilterCriteria) => void;
  onClose: () => void;
}

export function FilterModal({
  isOpen,
  initialCriteria,
  onApply,
  onClose,
}: FilterModalProps) {
  const [draft, setDraft] = useState<IdeaFilterCriteria>(initialCriteria);

  // Re-sync draft criteria whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft({ ...initialCriteria });
    }
  }, [isOpen, initialCriteria]);

  // Handle global Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyClick = () => {
    onApply(draft);
  };

  const preventEnterKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div
      data-testid="filter-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        data-testid="filter-modal-card"
        className="bg-surface-primary border border-border rounded-2xl p-6 shadow-2xl w-full max-w-md flex flex-col space-y-4 transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <FilterIcon />
            </div>
            <div>
              <h3
                id="filter-modal-title"
                className="text-base font-semibold text-content-primary"
              >
                Filter Ideas
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Specify criteria to narrow down your catalog
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="filter-modal-close-button"
            onClick={onClose}
            aria-label="Close filter modal"
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={preventEnterKey}
          className="space-y-3"
        >
          {/* Row 1: BPM Range */}
          <div>
            <label
              htmlFor="filter-bpm-min-input"
              title={FILTER_TOOLTIPS.bpm}
              className="block text-xs font-medium text-content-secondary mb-1 cursor-default select-none"
            >
              BPM (Range)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="filter-bpm-min-input"
                type="number"
                min="1"
                placeholder="Min"
                title={FILTER_TOOLTIPS.bpm}
                data-testid="filter-bpm-min"
                value={draft.bpmMin ?? ''}
                onKeyDown={preventEnterKey}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setDraft((prev) => ({
                    ...prev,
                    bpmMin: val === '' ? undefined : Math.max(1, Number(val)),
                  }));
                }}
                className="w-1/2 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-xs text-content-secondary select-none">–</span>
              <input
                id="filter-bpm-max-input"
                type="number"
                min="1"
                placeholder="Max"
                title={FILTER_TOOLTIPS.bpm}
                data-testid="filter-bpm-max"
                value={draft.bpmMax ?? ''}
                onKeyDown={preventEnterKey}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setDraft((prev) => ({
                    ...prev,
                    bpmMax: val === '' ? undefined : Math.max(1, Number(val)),
                  }));
                }}
                className="w-1/2 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Row 2: Musical Key */}
          <div>
            <label
              htmlFor="filter-key-input"
              title={FILTER_TOOLTIPS.key}
              className="block text-xs font-medium text-content-secondary mb-1 cursor-default select-none"
            >
              Key
            </label>
            <input
              id="filter-key-input"
              type="text"
              placeholder="e.g., C maj, Am, F#"
              title={FILTER_TOOLTIPS.key}
              data-testid="filter-key"
              value={draft.key ?? ''}
              onKeyDown={preventEnterKey}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, key: e.target.value }))
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Row 3: Authors */}
          <div>
            <label
              htmlFor="filter-authors-input"
              title={FILTER_TOOLTIPS.authors}
              className="block text-xs font-medium text-content-secondary mb-1 cursor-default select-none"
            >
              Authors
            </label>
            <input
              id="filter-authors-input"
              type="text"
              placeholder="e.g., John, Paul (comma-separated)"
              title={FILTER_TOOLTIPS.authors}
              data-testid="filter-authors"
              value={draft.authors ?? ''}
              onKeyDown={preventEnterKey}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, authors: e.target.value }))
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Row 4: Song Section */}
          <div>
            <label
              htmlFor="filter-section-input"
              title={FILTER_TOOLTIPS.section}
              className="block text-xs font-medium text-content-secondary mb-1 cursor-default select-none"
            >
              Section
            </label>
            <input
              id="filter-section-input"
              type="text"
              placeholder="e.g., Chorus, Verse, Bridge"
              title={FILTER_TOOLTIPS.section}
              data-testid="filter-section"
              value={draft.section ?? ''}
              onKeyDown={preventEnterKey}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, section: e.target.value }))
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Row 5: Instruments */}
          <div>
            <label
              htmlFor="filter-instruments-input"
              title={FILTER_TOOLTIPS.instruments}
              className="block text-xs font-medium text-content-secondary mb-1 cursor-default select-none"
            >
              Instruments
            </label>
            <input
              id="filter-instruments-input"
              type="text"
              placeholder="e.g., Guitar, Piano (comma-separated)"
              title={FILTER_TOOLTIPS.instruments}
              data-testid="filter-instruments"
              value={draft.instruments ?? ''}
              onKeyDown={preventEnterKey}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, instruments: e.target.value }))
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
          <button
            type="button"
            data-testid="filter-cancel-button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-content-primary bg-surface-secondary hover:bg-surface-hover border border-border transition-colors cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="filter-apply-button"
            onClick={handleApplyClick}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-accent hover:bg-accent/90 transition-colors cursor-pointer shadow-xs active:scale-95 select-none"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
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
