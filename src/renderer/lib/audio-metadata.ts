/**
 * Extracts audio duration in seconds from a File object using HTML5 Audio metadata parsing.
 * Non-blocking and memory-efficient: reads only container metadata without decompressing PCM samples.
 *
 * @param file The audio File object
 * @returns Duration in seconds (or 0 if failed to extract)
 */
export async function extractAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      return resolve(0);
    }

    const audio = new Audio();
    audio.src = objectUrl;

    const cleanup = () => {
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

    audio.onloadedmetadata = () => {
      const duration = isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve(duration);
    };

    audio.onerror = () => {
      cleanup();
      resolve(0);
    };
  });
}
