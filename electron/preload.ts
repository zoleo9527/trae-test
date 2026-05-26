import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('db', {
  query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
  run: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),
  transaction: (statements: { sql: string; params?: any[] }[]) => ipcRenderer.invoke('db:transaction', statements)
})

contextBridge.exposeInMainWorld('app', {
  getAppDataPath: () => ipcRenderer.invoke('app:getAppDataPath'),
  getCurrentUser: () => ipcRenderer.invoke('app:getCurrentUser'),
  setCurrentUser: (user: any) => ipcRenderer.invoke('app:setCurrentUser', user),
  onMenuNewAppeal: (callback: () => void) => {
    ipcRenderer.on('menu:new-appeal', callback)
  },
  removeMenuNewAppeal: (callback: () => void) => {
    ipcRenderer.removeListener('menu:new-appeal', callback)
  },
  onMenuAssignLocker: (callback: () => void) => {
    ipcRenderer.on('menu:assign-locker', callback)
  },
  removeMenuAssignLocker: (callback: () => void) => {
    ipcRenderer.removeListener('menu:assign-locker', callback)
  },
  onMenuSwitchRole: (callback: () => void) => {
    ipcRenderer.on('menu:switch-role', callback)
  },
  removeMenuSwitchRole: (callback: () => void) => {
    ipcRenderer.removeListener('menu:switch-role', callback)
  }
})

export {}
