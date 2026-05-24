const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;
let printWindows = new Map();

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: '家装监理-变更签认与费用追踪系统',
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createPrintWindow(content) {
  const printWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>打印回执</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 14px; color: #666; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table td { padding: 10px; border: 1px solid #ddd; }
        .info-table .label { background: #f5f5f5; width: 150px; font-weight: 500; }
        .sign-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .sign-box { width: 200px; text-align: center; }
        .sign-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 10px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(printHtml));

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({
      silent: false,
      printBackground: true,
    }, (success) => {
      if (!success) {
        dialog.showErrorBox('打印失败', '打印过程中出现错误，请重试。');
      }
      printWindow.close();
    });
  });

  printWindows.set(printWindow.id, printWindow);
  printWindow.on('closed', () => {
    printWindows.delete(printWindow.id);
  });
}

function createNewWindow(route) {
  const newWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  
  const isDev = !app.isPackaged;
  if (isDev) {
    newWindow.loadURL('http://localhost:5173/#' + route);
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: route,
    });
  }

  newWindow.on('closed', () => {
    printWindows.delete(newWindow.id);
  });
}

ipcMain.handle('print-receipt', async (event, content) => {
  try {
    createPrintWindow(content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-new-window', async (event, route) => {
  try {
    createNewWindow(route || '/');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-current-route', async () => {
  return { route: '/' };
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
