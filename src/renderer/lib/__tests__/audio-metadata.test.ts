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

  it('falls back to AudioContext decodeAudioData if audio.onerror fires', async () => {
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

    const mockDecode = vi.fn().mockResolvedValue({ duration: 18.2 });
    const mockClose = vi.fn().mockResolvedValue(undefined);

    class MockAudioContext {
      decodeAudioData = mockDecode;
      close = mockClose;
      state = 'running';
    }

    // @ts-expect-error Mock AudioContext
    window.AudioContext = MockAudioContext;

    const mockFile = new File(['valid audio buffer'], 'valid.m4a', { type: 'audio/mp4' });
    const duration = await extractAudioDuration(mockFile);

    expect(duration).toBe(18.2);
    expect(mockDecode).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio-url');
  });

  it('times out and cleans up if loadedmetadata never fires', async () => {
    vi.useFakeTimers();

    class MockHangingAudio {
      src = '';
      duration = NaN;
      onloadedmetadata: (() => void) | null = null;
      onerror: (() => void) | null = null;
      removeAttribute = vi.fn();
    }

    // @ts-expect-error Mock Audio
    window.Audio = MockHangingAudio;

    const mockFile = new File(['hanging audio'], 'hanging.wav', { type: 'audio/wav' });
    const durationPromise = extractAudioDuration(mockFile, 100);

    // Fast-forward time past timeout
    await vi.advanceTimersByTimeAsync(150);

    const duration = await durationPromise;
    expect(duration).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio-url');

    vi.useRealTimers();
  });
});

describe('resolveAudioUrlDuration', () => {
  const originalAudio = window.Audio;

  afterEach(() => {
    window.Audio = originalAudio;
    vi.restoreAllMocks();
  });

  it('resolves duration when loadedmetadata fires on stream URL', async () => {
    class MockStreamAudio {
      src = '';
      duration = 53.8;
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
    window.Audio = MockStreamAudio;

    const { resolveAudioUrlDuration } = await import('../audio-metadata');
    const dur = await resolveAudioUrlDuration('vault-audio://stream/recordings/memo.m4a');
    expect(dur).toBe(53.8);
  });

  it('returns 0 when error occurs loading stream URL', async () => {
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

    const { resolveAudioUrlDuration } = await import('../audio-metadata');
    const dur = await resolveAudioUrlDuration('vault-audio://stream/recordings/missing.wav');
    expect(dur).toBe(0);
  });
});
