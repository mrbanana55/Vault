import { useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { AudioTimeBar } from "./AudioTimeBar";

export interface HeaderProps {
  onImportFiles?: (files: FileList | File[]) => void;
}

export function Header({ onImportFiles }: HeaderProps = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onImportFiles) {
      onImportFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <header
      data-testid="app-header"
      className="h-13 py-3 border-b border-border bg-surface-primary flex items-center justify-between px-6 shrink-0 transition-colors select-none"
    >
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-base font-bold tracking-tight text-content-primary">
          Vault
        </span>
      </div>
      <AudioTimeBar />
      <div className="flex items-center gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".wav,.mp3,.m4a,.ogg,.flac"
          className="hidden"
          data-testid="header-file-input"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handleImportClick}
          data-testid="header-import-button"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-secondary text-content-primary hover:bg-surface-hover border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
          title="Import Audio Files"
        >
          <svg
            className="w-3.5 h-3.5 text-content-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span>Import</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
