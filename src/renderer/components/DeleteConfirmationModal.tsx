import { useEffect } from 'react';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  count: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  count,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="delete-confirmation-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div className="bg-surface-primary border border-border rounded-2xl p-6 shadow-2xl w-full max-w-sm flex flex-col space-y-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
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
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-base font-semibold text-content-primary">
              {count === 1 ? 'Delete Idea' : `Delete ${count} Ideas`}
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">Permanent action</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-content-secondary">
          Are you sure you want to delete {count === 1 ? 'this audio idea' : `these ${count} audio ideas`}? Once deleted, the audio cannot be recovered.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            data-testid="delete-cancel-button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-content-primary bg-surface-secondary hover:bg-surface-hover border border-border transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="delete-accept-button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? 'Deleting…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
