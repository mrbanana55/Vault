# Contract: Content Security Policy & Media Access

**Scope**: Security configuration in Renderer HTML and Main Process Protocol Registration
**Date**: 2026-09-08

---

## 1. Renderer HTML Content Security Policy

Located in `src/renderer/index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' vault-audio: blob:;"
/>
```

### Directive Breakdown
- `default-src 'self'`: Restricts default asset loading to the application origin.
- `script-src 'self'`: Permits application scripts only.
- `style-src 'self' 'unsafe-inline'`: Permits CSS and Tailwind runtime styles.
- `media-src 'self' vault-audio: blob:;`: **Explicitly permits media loading** for:
  - `'self'`: Local app assets.
  - `vault-audio:`: Custom protocol streaming audio chunks from `userData/audio_vault/`.
  - `blob:`: In-memory object URLs created via `URL.createObjectURL(file)` during file import metadata extraction.

---

## 2. Main Process Protocol Registration Privileges

Located in `src/main/audio/audio-protocol-handler.ts`:

```typescript
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'vault-audio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);
```

### Privileges
- `standard: true`: Standard URI parsing.
- `secure: true`: Treated as secure origin.
- `supportFetchAPI: true`: Supports WHATWG Fetch.
- `stream: true`: Buffers audio/video streams for `<audio>` and `<video>` tags.
- `bypassCSP: true`: Exempts `vault-audio` from CSP restrictions.
