const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;
let printWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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
  printWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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
}

ipcMain.handle('print-receipt', async (event, content) => {
  createPrintWindow(content);
  return { success: true };
});

ipcMain.handle('open-new-window', async (event, url) => {
  const newWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  
  const isDev = !app.isPackaged;
  if (isDev) {
    newWindow.loadURL('http://localhost:5173' + url);
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  
  return { success: true };
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
