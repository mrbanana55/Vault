# Project Constitution

1. **Stack Simplicity:** Stick to Electron, React, TS, Tailwind, Node, and SQLite; no extra dependencies without prior approval.
2. **Spec Driven:** Code must strictly reflect the active specification in `specs/`; no undocumented features or scope creep.
3. **Process Separation:** UI resides purely in Renderer; file system and SQLite stay strictly isolated in Main via IPC preload bridges.
4. **Verifiable Tests:** Every core IPC channel, audio utility, and SQLite query must have automated unit or integration tests passing cleanly.
5. **Data Integrity:** Audio files are stored strictly on the local file system; SQLite stores metadata and file path strings only.
6. **Unified Language:** All source code, types, DB schemas, IPC interfaces, comments, and commit messages must be strictly in English.
