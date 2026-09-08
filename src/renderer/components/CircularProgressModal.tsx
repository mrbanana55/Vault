import React, { useEffect } from 'react';

export interface CircularProgressModalProps {
  isOpen: boolean;
  progressPercentage: number; // 0 to 100
  currentFileName?: string;
  totalFiles: number;
  currentIndex: number;
  isComplete: boolean;
  errors?: Array<{ filename: string; error: string }>;
  onDismiss: () => void;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgressModal({
  isOpen,
  progressPercentage,
  currentFileName,
  totalFiles,
  currentIndex,
  isComplete,
  errors = [],
  onDismiss,
}: CircularProgressModalProps) {
  // Auto-dismiss after 1.2 seconds on clean completion with no errors
  useEffect(() => {
    if (isOpen && isComplete && errors.length === 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isComplete, errors.length, onDismiss]);

  if (!isOpen) return null;

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
  const strokeDashoffset = CIRCUMFERENCE - (clampedProgress / 100) * CIRCUMFERENCE;

  return (
    <div
      data-testid="circular-progress-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="bg-surface-primary border border-border rounded-2xl p-6 shadow-2xl w-full max-w-sm flex flex-col items-center text-center space-y-4 transition-colors">
        {/* SVG Circular Progress Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              className="stroke-border/50 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              className="stroke-accent-blue fill-none transition-all duration-300 ease-out"
              strokeWidth="8"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Percentage or Checkmark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete && errors.length === 0 ? (
              <svg
                className="w-8 h-8 text-green-500 animate-scale-in"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-xl font-bold tracking-tight text-content-primary">
                {clampedProgress}%
              </span>
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-1 w-full">
          <p className="text-sm font-semibold text-content-primary truncate">
            {isComplete ? 'Import Complete' : currentFileName || 'Importing audio...'}
          </p>
          <p className="text-xs text-content-secondary">
            {isComplete
              ? `Finished importing ${totalFiles} ideas`
              : `Importing ${currentIndex || 1} of ${totalFiles} ideas...`}
          </p>
        </div>

        {/* Error List if any */}
        {errors.length > 0 && (
          <div className="w-full max-h-32 overflow-y-auto text-left rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1.5 text-xs text-red-600 dark:text-red-400">
            <p className="font-semibold text-[11px] uppercase tracking-wider">
              Import Notices ({errors.length})
            </p>
            {errors.map((err, idx) => (
              <div key={idx} className="truncate">
                <span className="font-medium">{err.filename}:</span> {err.error}
              </div>
            ))}
          </div>
        )}

        {/* Action Button on Complete or Error */}
        {isComplete && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2 px-4 rounded-lg bg-surface-secondary text-content-primary hover:bg-surface-hover border border-border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
