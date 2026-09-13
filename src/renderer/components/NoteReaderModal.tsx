import { useEffect } from 'react';

export interface NoteReaderModalProps {
  isOpen: boolean;
  title: string;
  notes: string;
  onClose: () => void;
}

export function NoteReaderModal({
  isOpen,
  title,
  notes,
  onClose,
}: NoteReaderModalProps) {
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

  return (
    <div
      data-testid="note-reader-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-reader-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        data-testid="note-reader-card"
        className="bg-surface-primary border border-border rounded-2xl p-6 shadow-2xl w-full max-w-lg flex flex-col space-y-4 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
              <NoteIcon />
            </div>
            <div>
              <h3 id="note-reader-title" className="text-base font-semibold text-content-primary">
                {title}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">Idea Notes</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="note-reader-x-button"
            onClick={onClose}
            aria-label="Close notes modal"
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="bg-surface-secondary/40 border border-border rounded-xl p-4 max-h-96 overflow-y-auto">
          <p className="text-xs leading-relaxed text-content-primary whitespace-pre-wrap break-words">
            {notes}
          </p>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            data-testid="note-reader-close-button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-content-primary bg-surface-secondary hover:bg-surface-hover border border-border transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
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
