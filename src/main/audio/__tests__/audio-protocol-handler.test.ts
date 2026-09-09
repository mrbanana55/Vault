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

    it('streams full audio with status 200, Accept-Ranges, and correct audio/wav MIME header when no Range is requested', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'test.wav');
      fs.writeFileSync(testFile, Buffer.from('test audio content 1234567890'));

      const request = new Request('vault-audio://stream/recordings/test.wav');
      const response = await registeredHandler!(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/wav');
      expect(response.headers.get('Accept-Ranges')).toBe('bytes');
      expect(response.headers.get('Content-Length')).toBe(String(Buffer.from('test audio content 1234567890').length));
      const text = await response.text();
      expect(text).toBe('test audio content 1234567890');
    });

    it('returns 206 Partial Content with Content-Range for HTTP Range requests on .wav files', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'test.wav');
      const content = '0123456789abcdefghijklmnopqrstuvwxyz';
      fs.writeFileSync(testFile, Buffer.from(content));

      const request = new Request('vault-audio://stream/recordings/test.wav', {
        headers: { Range: 'bytes=10-19' },
      });
      const response = await registeredHandler!(request);

      expect(response.status).toBe(206);
      expect(response.statusText).toBe('Partial Content');
      expect(response.headers.get('Content-Type')).toBe('audio/wav');
      expect(response.headers.get('Accept-Ranges')).toBe('bytes');
      expect(response.headers.get('Content-Range')).toBe(`bytes 10-19/${content.length}`);
      expect(response.headers.get('Content-Length')).toBe('10');
      const text = await response.text();
      expect(text).toBe('abcdefghij');
    });

    it('overrides Content-Type with audio/mp4 for .m4a files and supports seeking to end of file', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'idea.m4a');
      const content = 'm4a-audio-data-test-string-here';
      fs.writeFileSync(testFile, Buffer.from(content));

      const request = new Request('vault-audio://stream/recordings/idea.m4a', {
        headers: { Range: 'bytes=10-' },
      });
      const response = await registeredHandler!(request);

      expect(response.status).toBe(206);
      expect(response.headers.get('Content-Type')).toBe('audio/mp4');
      expect(response.headers.get('Content-Range')).toBe(`bytes 10-${content.length - 1}/${content.length}`);
      const text = await response.text();
      expect(text).toBe(content.slice(10));
    });

    it('sets audio/mpeg for .mp3 files and handles Range requests', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'track.mp3');
      const content = 'mp3-binary-payload-test-example';
      fs.writeFileSync(testFile, Buffer.from(content));

      const request = new Request('vault-audio://stream/recordings/track.mp3', {
        headers: { Range: 'bytes=4-9' },
      });
      const response = await registeredHandler!(request);

      expect(response.status).toBe(206);
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
      expect(response.headers.get('Content-Range')).toBe(`bytes 4-9/${content.length}`);
      const text = await response.text();
      expect(text).toBe('binary');
    });

    it('returns 416 Range Not Satisfiable for out of range requests', async () => {
      let registeredHandler: ((request: Request) => Promise<Response>) | null = null;
      const mockProtocol = {
        handle: vi.fn((scheme, handler) => {
          registeredHandler = handler;
        }),
      } as unknown as Protocol;

      handleVaultAudioProtocol(mockProtocol, service);

      const recordingsDir = path.join(vaultBase, 'recordings');
      const testFile = path.join(recordingsDir, 'track.wav');
      fs.writeFileSync(testFile, Buffer.from('short'));

      const request = new Request('vault-audio://stream/recordings/track.wav', {
        headers: { Range: 'bytes=100-200' },
      });
      const response = await registeredHandler!(request);

      expect(response.status).toBe(416);
      expect(response.headers.get('Content-Range')).toBe('bytes */5');
    });
  });
});
