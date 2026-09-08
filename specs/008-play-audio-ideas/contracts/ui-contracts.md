# UI Contracts & Interfaces: Play Audio Ideas

**Scope**: Renderer Process Components and Hooks
**Date**: 2026-09-08

---

## 1. AudioPlayerContext API

Exposed by `AudioPlayerProvider` and consumed via `useAudioPlayer()` hook.

```typescript
export interface AudioPlayerContextValue {
  /** The currently loaded audio note, or null if nothing has been played */
  currentNote: NoteWithInstruments | null;

  /** True if audio is actively playing */
  isPlaying: boolean;

  /** Current playback position in seconds */
  currentTime: number;

  /** Total duration in seconds of current note */
  duration: number;

  /** Explicitly play a given note */
  play: (note: NoteWithInstruments) => void;

  /** Pause the current playback */
  pause: () => void;

  /**
   * Toggle play/pause for the given note, or toggle active note if omitted.
   * If note is different from currentNote, stops current and plays new note.
   */
  togglePlay: (note?: NoteWithInstruments) => void;

  /** Seek playback to a specific timestamp in seconds */
  seek: (timeSeconds: number) => void;

  /** Error message if playback failed, or null */
  error: string | null;
}
```

---

## 2. Row Play/Pause Button Contract (`TableRow.tsx`)

### Position & Layout
- Placed in a dedicated leftmost `<td>` column (Column 0, before `Title`).
- Column header: empty `<th>` or subtle audio icon header.
- Width: Fixed compact width (approx. 40px) matching row height.

### Visual State Attributes
- `data-testid`: `row-play-button-${note.id}`
- `aria-label`: `"Play [note.title]"` when paused/idle; `"Pause [note.title]"` when playing.
- Icon:
  - Play triangle icon when idle or paused.
  - Pause double-bar icon when actively playing.
- Hover effect: `hover:bg-surface-secondary text-content-secondary hover:text-accent-blue`.

### Row Highlighting
- When `currentNote?.id === note.id`, the row applies subtle active styling (e.g., `bg-surface-secondary/40` or left border accent) to indicate it is the active track.

---

## 3. Top-Center Scrubber / Time Bar Contract (`Header.tsx` / `AudioTimeBar.tsx`)

### Placement
- Positioned in the horizontal center of `Header.tsx` between the left brand/logo section and the right action buttons (Import / ThemeToggle).
- Max width: ~360px to 480px, responsive.

### Elements
1. **Interactive Scrubber Slider**:
   - Element: `<input type="range" min={0} max={duration || 100} value={currentTime} step={0.1} />`
   - Attributes:
     - `data-testid="audio-scrubber"`
     - `aria-label="Audio playback scrubber"`
     - `aria-valuemin={0}`
     - `aria-valuemax={duration}`
     - `aria-valuenow={currentTime}`
     - `disabled={!currentNote}`
   - Interactions:
     - `onChange` / `onInput`: updates position during scrubbing.
     - `onMouseUp` / `onTouchEnd` / `onKeyUp`: commits final seek offset to audio element.

2. **Duration & Elapsed Time Display**:
   - Placed to the right of the scrubber bar.
   - Container `data-testid="audio-time-display"`.
   - Text format: `{formatDuration(currentTime)} / {formatDuration(duration)}`
   - Typography: tabular numerals (`tabular-nums`), text-xs, `text-content-secondary`.
   - When idle/no track loaded: `0:00 / 0:00` or dimmed placeholder.

---

## 4. Keyboard Shortcut Contract (Space Bar)

### Trigger
- Window `keydown` event where `e.code === 'Space' || e.key === ' '`.

### Guard Condition (No-Op for Playback)
```typescript
const isInputFocused =
  document.activeElement instanceof HTMLInputElement ||
  document.activeElement instanceof HTMLTextAreaElement ||
  (document.activeElement as HTMLElement)?.isContentEditable ||
  document.activeElement?.getAttribute('role') === 'textbox';

if (isInputFocused) {
  // Let the browser handle standard typing (insert whitespace)
  return;
}

// Intercept spacebar to prevent page scrolling and toggle playback
e.preventDefault();
togglePlay();
```
