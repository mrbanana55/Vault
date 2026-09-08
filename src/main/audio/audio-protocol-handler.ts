import fs from 'fs';
import { pathToFileURL } from 'url';
import { net, type Protocol } from 'electron';
import type { AudioStorageService } from './audio-storage-service';

export const VAULT_AUDIO_SCHEME = 'vault-audio';

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
 * Attaches the vault-audio protocol handler using protocol.handle.
 * Delegates streaming and HTTP Range request handling to net.fetch.
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

      const fileUrl = pathToFileURL(absolutePath).toString();
      // Forward the original request headers (e.g. Range) to net.fetch
      return await net.fetch(fileUrl, {
        headers: request.headers,
      });
    } catch (err) {
      console.error('Failed to handle vault-audio request:', err);
      return new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  });
}
