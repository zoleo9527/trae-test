import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  database: {
    getMembers: (params?: any) => ipcRenderer.invoke('db:get-members', params),
    getMember: (id: number) => ipcRenderer.invoke('db:get-member', id),
    createMember: (data: any) => ipcRenderer.invoke('db:create-member', data),
    updateMember: (id: number, data: any) => ipcRenderer.invoke('db:update-member', id, data),
    deleteMember: (id: number) => ipcRenderer.invoke('db:delete-member', id),
    
    getFilms: (params?: any) => ipcRenderer.invoke('db:get-films', params),
    getFilm: (id: number) => ipcRenderer.invoke('db:get-film', id),
    createFilm: (data: any) => ipcRenderer.invoke('db:create-film', data),
    updateFilm: (id: number, data: any) => ipcRenderer.invoke('db:update-film', id, data),
    deleteFilm: (id: number) => ipcRenderer.invoke('db:delete-film', id),
    
    getProcessRecords: (params?: any) => ipcRenderer.invoke('db:get-process-records', params),
    createProcessRecord: (data: any) => ipcRenderer.invoke('db:create-process-record', data),
    updateProcessRecord: (id: number, data: any) => ipcRenderer.invoke('db:update-process-record', id, data),
    
    getReminders: (params?: any) => ipcRenderer.invoke('db:get-reminders', params),
    createReminder: (data: any) => ipcRenderer.invoke('db:create-reminder', data),
    updateReminder: (id: number, data: any) => ipcRenderer.invoke('db:update-reminder', id, data),
    dismissReminder: (id: number) => ipcRenderer.invoke('db:dismiss-reminder', id),
    
    getAuditLogs: (params?: any) => ipcRenderer.invoke('db:get-audit-logs', params),
    createAuditLog: (data: any) => ipcRenderer.invoke('db:create-audit-log', data),
    
    getDashboardStats: () => ipcRenderer.invoke('db:get-dashboard-stats'),
    
    batchImportFilms: (data: any[]) => ipcRenderer.invoke('db:batch-import-films', data),
    exportData: (type: string) => ipcRenderer.invoke('db:export-data', type),
    backupDatabase: () => ipcRenderer.invoke('db:backup-database'),
    restoreDatabase: (filePath: string) => ipcRenderer.invoke('db:restore-database', filePath),
    
    checkFilmDuplicate: (filmNo: string, excludeId?: number) => 
      ipcRenderer.invoke('db:check-film-duplicate', filmNo, excludeId),
  },
  
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
    showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options)
  },

  onDatabaseRestored: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('database-restored', handler)
    return () => { ipcRenderer.removeListener('database-restored', handler) }
  }
})
