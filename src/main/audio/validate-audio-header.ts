import type { AudioFormat } from '@shared/types';

/**
 * Validates whether the given binary buffer begins with the magic byte
 * signatures corresponding to the claimed audio format.
 *
 * @param header Buffer containing at least the initial bytes of the file (12+ bytes recommended).
 * @param format Claimed audio format extension.
 * @returns true if header matches the expected format signature, false otherwise.
 */
export function validateAudioHeader(header: Buffer, format: AudioFormat): boolean {
  if (!header || header.length === 0) {
    return false;
  }

  switch (format) {
    case 'wav': {
      // Must have "RIFF" at offset 0 and "WAVE" at offset 8
      if (header.length < 12) return false;
      const isRiff =
        header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46; // 'RIFF'
      const isWave =
        header[8] === 0x57 &&
        header[9] === 0x41 &&
        header[10] === 0x56 &&
        header[11] === 0x45; // 'WAVE'
      return isRiff && isWave;
    }

    case 'mp3': {
      // Check for ID3 tag header ("ID3") at offset 0
      if (header.length >= 3 && header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) {
        return true;
      }
      // Or check for MPEG frame sync: 0xFF followed by 0xFB, 0xF3, or 0xF2
      if (header.length >= 2 && header[0] === 0xff) {
        const second = header[1];
        if (second === 0xfb || second === 0xf3 || second === 0xf2) {
          return true;
        }
        // General MPEG frame sync (11 bits set: 0xFF followed by top 3 bits set)
        if ((second & 0xe0) === 0xe0) {
          return true;
        }
      }
      return false;
    }

    case 'm4a': {
      // Offset 4 must be "ftyp" (0x66, 0x74, 0x79, 0x70)
      if (header.length < 8) return false;
      return (
        header[4] === 0x66 &&
        header[5] === 0x74 &&
        header[6] === 0x79 &&
        header[7] === 0x70
      );
    }

    case 'ogg': {
      // Offset 0 must be "OggS" (0x4F, 0x67, 0x67, 0x53)
      if (header.length < 4) return false;
      return (
        header[0] === 0x4f &&
        header[1] === 0x67 &&
        header[2] === 0x67 &&
        header[3] === 0x53
      );
    }

    case 'flac': {
      // Offset 0 must be "fLaC" (0x66, 0x4C, 0x61, 0x43)
      if (header.length < 4) return false;
      return (
        header[0] === 0x66 &&
        header[1] === 0x4c &&
        header[2] === 0x61 &&
        header[3] === 0x43
      );
    }

    default:
      return false;
  }
}
