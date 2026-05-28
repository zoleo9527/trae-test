/// <reference types="vite/client" />

interface ElectronAPI {
  database: {
    getMembers: (params?: any) => Promise<any>
    getMember: (id: number) => Promise<any>
    createMember: (data: any) => Promise<any>
    updateMember: (id: number, data: any) => Promise<any>
    deleteMember: (id: number) => Promise<any>
    
    getFilms: (params?: any) => Promise<any>
    getFilm: (id: number) => Promise<any>
    createFilm: (data: any) => Promise<any>
    updateFilm: (id: number, data: any) => Promise<any>
    deleteFilm: (id: number) => Promise<any>
    
    getProcessRecords: (params?: any) => Promise<any>
    createProcessRecord: (data: any) => Promise<any>
    updateProcessRecord: (id: number, data: any) => Promise<any>
    
    getReminders: (params?: any) => Promise<any>
    createReminder: (data: any) => Promise<any>
    updateReminder: (id: number, data: any) => Promise<any>
    dismissReminder: (id: number) => Promise<any>
    
    getAuditLogs: (params?: any) => Promise<any>
    createAuditLog: (data: any) => Promise<any>
    
    getDashboardStats: () => Promise<any>
    
    batchImportFilms: (data: any[]) => Promise<any>
    exportData: (type: string) => Promise<any>
    backupDatabase: () => Promise<any>
    restoreDatabase: (filePath: string) => Promise<any>
    
    checkFilmDuplicate: (filmNo: string, excludeId?: number) => Promise<boolean>
  }
  
  dialog: {
    showOpenDialog: (options: any) => Promise<any>
    showSaveDialog: (options: any) => Promise<any>
    showMessageBox: (options: any) => Promise<any>
  }

  onDatabaseRestored: (callback: () => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
