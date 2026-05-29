const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

let mainWindow
let windows = new Map()

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    title: '汽配商行管理系统'
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('open-new-window', async (event, { url, title, width = 1000, height = 700 }) => {
  const windowId = Date.now().toString()
  const newWindow = new BrowserWindow({
    width,
    height,
    title,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    parent: mainWindow
  })

  if (process.env.NODE_ENV === 'development') {
    newWindow.loadURL(`http://localhost:5173${url}`)
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  windows.set(windowId, newWindow)

  newWindow.on('closed', () => {
    windows.delete(windowId)
  })

  return windowId
})

ipcMain.handle('print-content', async (event, content) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`)

  return new Promise((resolve) => {
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({}, (success) => {
        printWindow.close()
        resolve(success)
      })
    })
  })
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  return dialog.showSaveDialog(options)
})

app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
