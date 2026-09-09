import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { type Protocol } from 'electron';
import type { AudioStorageService } from './audio-storage-service';

export const VAULT_AUDIO_SCHEME = 'vault-audio';

const AUDIO_MIME_TYPES: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
};

/**
 * Registers the vault-audio scheme as privileged.
 * MUST be called before app.whenReady().
 */
export function registerVaultAudioScheme(protocol: Protocol): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: VAULT_AUDIO_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}

/**
 * Extracts relative audio path from a vault-audio URL.
 * Supports:
 * - vault-audio://stream/recordings/uuid.wav -> recordings/uuid.wav
 * - vault-audio://recordings/uuid.wav -> recordings/uuid.wav
 */
export function parseVaultAudioUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  if (parsed.hostname === 'stream') {
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  }
  // Fallback: hostname is the first directory component
  const combined = parsed.hostname ? `${parsed.hostname}${parsed.pathname}` : parsed.pathname;
  return decodeURIComponent(combined.replace(/^\/+/, ''));
}

/**
 * Serves an audio file from the filesystem with full HTTP Range request support (status 206),
 * enabling seeking/scrubbing in HTML5 media elements.
 */
export function serveAudioFile(absolutePath: string, rangeHeader?: string | null): Response {
  const stat = fs.statSync(absolutePath);
  const fileSize = stat.size;
  const ext = path.extname(absolutePath).toLowerCase();
  const mimeType = AUDIO_MIME_TYPES[ext] || 'application/octet-stream';

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      let start: number;
      let end: number;

      if (!match[1] && match[2]) {
        const suffixLength = parseInt(match[2], 10);
        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else {
        start = match[1] ? parseInt(match[1], 10) : 0;
        end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      }

      if (end >= fileSize) {
        end = fileSize - 1;
      }

      if (start < fileSize && start <= end) {
        const chunkSize = end - start + 1;
        const nodeStream = fs.createReadStream(absolutePath, { start, end });
        const webStream = Readable.toWeb(nodeStream);

        return new Response(webStream as unknown as BodyInit, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Type': mimeType,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
          },
        });
      }

      return new Response('Requested Range Not Satisfiable', {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: {
          'Content-Range': `bytes */${fileSize}`,
        },
      });
    }
  }

  const nodeStream = fs.createReadStream(absolutePath);
  const webStream = Readable.toWeb(nodeStream);

  return new Response(webStream as unknown as BodyInit, {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
    },
  });
}

/**
 * Attaches the vault-audio protocol handler using protocol.handle.
 * Delegates streaming and HTTP Range request handling to serveAudioFile.
 * MUST be called after app.whenReady().
 */
export function handleVaultAudioProtocol(
  protocol: Protocol,
  audioStorageService: AudioStorageService
): void {
  protocol.handle(VAULT_AUDIO_SCHEME, async (request) => {
    try {
      const relativePath = parseVaultAudioUrl(request.url);

      let absolutePath: string;
      try {
        absolutePath = audioStorageService.resolveAbsolutePath(relativePath);
      } catch {
        return new Response('Access denied: Path traversal detected', {
          status: 403,
          statusText: 'Forbidden',
        });
      }

      if (!fs.existsSync(absolutePath)) {
        return new Response('File not found', {
          status: 404,
          statusText: 'Not Found',
        });
      }

      const rangeHeader = request.headers.get('Range') || request.headers.get('range');
      return serveAudioFile(absolutePath, rangeHeader);
    } catch (err) {
      console.error('Failed to handle vault-audio request:', err);
      return new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  });
}
