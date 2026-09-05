/**
 * Formats seconds into human-readable m:ss or h:mm:ss display string.
 * Examples: 83 → "1:23", 5 → "0:05", 0 → "0:00", 3665 → "1:01:05"
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats an ISO 8601 date string into localized short format (e.g., "Sep 3, 2026").
 * Returns an empty string if date is missing or invalid.
 */
export function formatDate(isoString: string): string {
  if (!isoString) {
    return '';
  }

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
