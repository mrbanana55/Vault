import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase } from './db/client';
import { runMigrations } from './db/migrations';
import { registerAllHandlers } from './ipc';
import { AudioStorageService, registerVaultAudioScheme, handleVaultAudioProtocol } from './audio';

// Register vault-audio scheme as privileged before app is ready
registerVaultAudioScheme(protocol);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL(devServerUrl).catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html')).catch(() => {
        // Dev server and built file not yet present
      });
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'vault.db');
  const db = getDatabase(dbPath);
  runMigrations(db);

  const audioVaultPath = path.join(app.getPath('userData'), 'audio_vault');
  const audioStorageService = new AudioStorageService(audioVaultPath);
  audioStorageService.ensureVaultDirectory();

  handleVaultAudioProtocol(protocol, audioStorageService);

  registerAllHandlers(ipcMain, db, audioStorageService);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

app.on('will-quit', () => {
  closeDatabase();
});
