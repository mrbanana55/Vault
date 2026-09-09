import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { net, type Protocol } from 'electron';
import { AudioStorageService } from '../audio-storage-service';
import {
  parseVaultAudioUrl,
  registerVaultAudioScheme,
  handleVaultAudioProtocol,
  VAULT_AUDIO_SCHEME,
} from '../audio-protocol-handler';

vi.mock('electron', () => ({
  net: {
    fetch: vi.fn(),
  },
}));

describe('audio-protocol-handler', () => {
  let tempDir: string;
  let vaultBase: string;
  let service: AudioStorageService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-audio-protocol-test-'));
    vaultBase = path.join(tempDir, 'audio_vault');
    service = new AudioStorageService(vaultBase);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('parseVaultAudioUrl', () => {
    it('parses standard vault-audio://stream/ URL correctly', () => {
      const url = 'vault-audio://stream/recordings/sample-123.wav';
      expect(parseVaultAudioUrl(url)).toBe('recordings/sample-123.wav');
    });

    it('decodes encoded URL components properly', () => {
      const url = 'vault-audio://stream/recordings/my%20voice%20memo.wav';
      expect(parseVaultAudioUrl(url)).toBe('recordings/my voice memo.wav');
    });

    it('handles fallback vault-audio://recordings/sample.wav format', () => {
      const url = 'vault-audio://recordings/sample.wav';
      expect(parseVaultAudioUrl(url)).toBe('recordings/sample.wav');
    });
  });

  describe('registerVaultAudioScheme', () => {
    it('registers vault-audio scheme with standard, secure, supportFetchAPI, stream, and bypassCSP flags', () => {
      const mockProtocol = {
        registerSchemesAsPrivileged: vi.fn(),
      } as unknown as Protocol;

      registerVaultAudioScheme(mockProtocol);

      expect(mockProtocol.registerSchemesAsPrivileged).toHaveBeenCalledWith([
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
    });
  });

  describe('handleVaultAudioProtocol', () => {
    it('attaches handler and rejects path traversal with 403 Forbidden', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          if (scheme === VAULT_AUDIO_SCHEME) {
            registeredHandler = handler;
          }
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);
      expect(mockProtocol.handle).toHaveBeenCalledWith(VAULT_AUDIO_SCHEME, expect.any(Function));
      expect(registeredHandler).not.toBeNull();

      const request = new Request('vault-audio://stream/%2E%2E%2F%2E%2E%2Fsecret.txt');
      const response = await registeredHandler!(request);

      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toContain('Path traversal detected');
    });

    it('returns 404 Not Found when the file does not exist', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const request = new Request('vault-audio://stream/recordings/nonexistent.wav');
      const response = await registeredHandler!(request);

      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toContain('File not found');
    });

    it('delegates to net.fetch with file:// URL and sets correct audio/wav MIME header', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'test.wav');
      fs.writeFileSync(testFile, Buffer.from('test audio content'));

      const mockResponse = new Response('audio stream content', {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      vi.mocked(net.fetch).mockResolvedValueOnce(mockResponse);

      const request = new Request('vault-audio://stream/recordings/test.wav', {
        headers: { Range: 'bytes=0-10' },
      });
      const response = await registeredHandler!(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/wav');
      expect(net.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^file:\/\//),
        expect.objectContaining({
          headers: request.headers,
        })
      );
    });

    it('overrides Content-Type with audio/mp4 for .m4a files', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'idea.m4a');
      fs.writeFileSync(testFile, Buffer.from('m4a audio content'));

      const mockResponse = new Response('m4a binary', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      vi.mocked(net.fetch).mockResolvedValueOnce(mockResponse);

      const request = new Request('vault-audio://stream/recordings/idea.m4a');
      const response = await registeredHandler!(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/mp4');
    });

    it('sets audio/mpeg for .mp3 files', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'track.mp3');
      fs.writeFileSync(testFile, Buffer.from('mp3 audio content'));

      const mockResponse = new Response('mp3 binary', {
        status: 206,
        statusText: 'Partial Content',
      });
      vi.mocked(net.fetch).mockResolvedValueOnce(mockResponse);

      const request = new Request('vault-audio://stream/recordings/track.mp3', {
        headers: { Range: 'bytes=10-20' },
      });
      const response = await registeredHandler!(request);

      expect(response.status).toBe(206);
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    });
  });
});
