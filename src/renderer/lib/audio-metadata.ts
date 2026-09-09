/**
 * Fallback duration extraction using Web Audio API AudioContext.decodeAudioData.
 */
async function tryDecodeAudioData(file: File): Promise<number> {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return 0;

    const ctx = new AudioCtx();
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      return Number.isFinite(audioBuffer.duration) && audioBuffer.duration > 0
        ? audioBuffer.duration
        : 0;
    } finally {
      if (ctx.state !== 'closed' && typeof ctx.close === 'function') {
        ctx.close().catch(() => {});
      }
    }
  } catch {
    return 0;
  }
}

/**
 * Extracts audio duration in seconds from a File object using HTML5 Audio metadata parsing.
 * Non-blocking and memory-efficient: reads only container metadata without decompressing PCM samples.
 * Falls back to AudioContext.decodeAudioData and enforces a safety timeout.
 *
 * @param file The audio File object
 * @param timeoutMs Maximum time to wait for metadata before fallback/timeout (default: 3000ms)
 * @returns Duration in seconds (or 0 if failed to extract)
 */
export async function extractAudioDuration(file: File, timeoutMs = 3000): Promise<number> {
  return new Promise((resolve) => {
    let objectUrl = '';
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      return tryDecodeAudioData(file).then(resolve);
    }

    const audio = new Audio();
    audio.src = objectUrl;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
      try {
        audio.removeAttribute('src');
      } catch {
        // ignore
      }
    };

    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(duration);
    };

    const handleFallback = async () => {
      cleanup();
      const fallbackDuration = await tryDecodeAudioData(file);
      finish(fallbackDuration);
    };

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      if (duration > 0) {
        finish(duration);
      } else {
        handleFallback();
      }
    };

    audio.onerror = () => {
      handleFallback();
    };

    timer = setTimeout(() => {
      handleFallback();
    }, timeoutMs);
  });
}

/**
 * Resolves audio duration in seconds from an audio URL (e.g. vault-audio://stream/...)
 * using HTML5 Audio container metadata inspection.
 *
 * @param url The audio stream URL
 * @param timeoutMs Maximum time to wait for metadata (default: 3000ms)
 * @returns Duration in seconds (or 0 if failed to resolve)
 */
export async function resolveAudioUrlDuration(url: string, timeoutMs = 3000): Promise<number> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const audio = new Audio();
    audio.src = url;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        audio.removeAttribute('src');
      } catch {
        // ignore
      }
    };

    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(duration);
    };

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      finish(duration);
    };

    audio.onerror = () => {
      finish(0);
    };

    timer = setTimeout(() => {
      finish(0);
    }, timeoutMs);
  });
}
