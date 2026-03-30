const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database');

let mainWindow;
let joriyKitob = null;

function activeWindow() {
  return BrowserWindow.getFocusedWindow() || mainWindow;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    resizable: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const ism = Database.getIsm();
  if (ism) {
    mainWindow.loadFile('ui/menu.html');
  } else {
    mainWindow.loadFile('ui/kirish.html');
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ──────────────────────────────────────────

ipcMain.handle('save-ism', (event, ism) => {
  Database.saveIsm(ism);
  mainWindow.loadFile('ui/menu.html');
});

ipcMain.handle('update-ism', (event, ism) => {
  Database.saveIsm(ism);
  return { ok: true, ism };
});

ipcMain.handle('get-ism', () => {
  return Database.getIsm();
});

ipcMain.handle('get-app-stats', () => {
  return {
    ism: Database.getIsm(),
    statistika: Database.getStatistika()
  };
});

ipcMain.handle('save-app-stats', (event, payload) => {
  const bolim = payload && payload.bolim ? String(payload.bolim) : 'noma`lum';
  const togri = payload && Number.isFinite(Number(payload.togri)) ? Number(payload.togri) : 0;
  const xato = payload && Number.isFinite(Number(payload.xato)) ? Number(payload.xato) : 0;
  Database.addStatistika(bolim, togri, xato);
  return { ok: true };
});

ipcMain.handle('clear-app-stats', () => {
  Database.clearStatistika();
  return { ok: true };
});

ipcMain.handle('reset-user', () => {
  Database.clearFoydalanuvchi();
  Database.clearStatistika();
  mainWindow.loadFile('ui/kirish.html');
  return { ok: true };
});

let readerWindow = null;

ipcMain.handle('kitob-och', (e, kitob) => {
  joriyKitob = kitob;
  
  if (readerWindow) {
    readerWindow.close();
    readerWindow = null;
  }

  readerWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    resizable: true,
    frame: true,
    title: kitob.nom,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  readerWindow.loadFile('bolimlar/kutubxona/reader.html');
  
  readerWindow.on('closed', () => {
    readerWindow = null;
  });
});

ipcMain.handle('joriy-kitob-olish', () => joriyKitob);

// Asosiy menyular
ipcMain.handle('goto', (event, page) => {
  const pages = {
    'menu':       'ui/menu.html',
    'oyinlar':    'bolimlar/oyinlar/index.html',
    'kutubxona':  'bolimlar/kutubxona/index.html',
    'zakovat':    'bolimlar/zakovat/index.html',
    'evrika':     'bolimlar/evrika/index.html',
    'reyting':    'bolimlar/reyting/index.html',
    'sozlamalar': 'bolimlar/sozlamalar/index.html',
  };
  if (pages[page]) mainWindow.loadFile(pages[page]);
});

// O'yinlar
ipcMain.handle('goto-oyinlar', (event, oyinNomi) => {
  const oyinlar = {
    'raqam_top':  'bolimlar/oyinlar/raqam_top/index.html',
    'x_o':        'bolimlar/oyinlar/x_o/index.html',
    'tez_hisob':  'bolimlar/oyinlar/tez_hisob/index.html',
    'xotira':     'bolimlar/oyinlar/xotira/index.html',
    'sudoku':     'bolimlar/oyinlar/sudoku/index.html',
  };
  if (oyinlar[oyinNomi]) mainWindow.loadFile(oyinlar[oyinNomi]);
});

// Oyna boshqaruvi
ipcMain.handle('close-app',    () => app.quit());
ipcMain.handle('minimize-app', () => {
  const win = activeWindow();
  if (win) win.minimize();
});
ipcMain.handle('toggle-maximize-app', () => {
  const win = activeWindow();
  if (!win) return { maximized: false };
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
  return { maximized: win.isMaximized() };
});
ipcMain.handle('is-maximized-app', () => {
  const win = activeWindow();
  return win ? win.isMaximized() : false;
});
