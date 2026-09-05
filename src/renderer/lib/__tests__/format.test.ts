import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate } from '../format';

describe('formatDuration', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats sub-minute seconds with leading zero', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(9)).toBe('0:09');
  });

  it('formats seconds over one minute', () => {
    expect(formatDuration(83)).toBe('1:23');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(120)).toBe('2:00');
  });

  it('floors fractional seconds', () => {
    expect(formatDuration(5.9)).toBe('0:05');
  });

  it('formats durations over an hour', () => {
    expect(formatDuration(3665)).toBe('1:01:05');
  });

  it('handles negative or NaN inputs gracefully', () => {
    expect(formatDuration(-10)).toBe('0:00');
    expect(formatDuration(NaN)).toBe('0:00');
  });
});

describe('formatDate', () => {
  it('formats ISO date to localized short date format', () => {
    const formatted = formatDate('2026-09-03T14:30:00.000Z');
    expect(formatted).toMatch(/Sep/);
    expect(formatted).toMatch(/2026/);
  });

  it('returns empty string for empty or invalid date input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('invalid-date')).toBe('');
  });
});
