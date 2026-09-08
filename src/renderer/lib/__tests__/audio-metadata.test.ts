import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractAudioDuration } from '../audio-metadata';

describe('extractAudioDuration', () => {
  const originalAudio = window.Audio;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:test-audio-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.Audio = originalAudio;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('extracts duration when loadedmetadata event fires', async () => {
    class MockAudio {
      src = '';
      duration = 42.5;
      onloadedmetadata: (() => void) | null = null;
      onerror: (() => void) | null = null;
      removeAttribute = vi.fn();

      constructor() {
        setTimeout(() => {
          if (this.onloadedmetadata) this.onloadedmetadata();
        }, 10);
      }
    }

    // @ts-expect-error Mock Audio
    window.Audio = MockAudio;

    const mockFile = new File(['dummy audio content'], 'riff.wav', { type: 'audio/wav' });
    const duration = await extractAudioDuration(mockFile);

    expect(duration).toBe(42.5);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio-url');
  });

  it('returns 0 fallback and revokes URL on error', async () => {
    class MockErrorAudio {
      src = '';
      duration = NaN;
      onloadedmetadata: (() => void) | null = null;
      onerror: (() => void) | null = null;
      removeAttribute = vi.fn();

      constructor() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 10);
      }
    }

    // @ts-expect-error Mock Audio
    window.Audio = MockErrorAudio;

    const mockFile = new File(['invalid audio'], 'corrupted.wav', { type: 'audio/wav' });
    const duration = await extractAudioDuration(mockFile);

    expect(duration).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio-url');
  });
});
