import type { Member, Film, ProcessRecord, Reminder, AuditLog, DashboardStats, PaginationParams, PaginatedResult } from '@/types'

const api = window.electronAPI

export const memberApi = {
  getList: (params?: PaginationParams): Promise<PaginatedResult<Member>> => 
    api.database.getMembers(params),
  getOne: (id: number): Promise<Member> => 
    api.database.getMember(id),
  create: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> => 
    api.database.createMember(data),
  update: (id: number, data: Partial<Member>): Promise<boolean> => 
    api.database.updateMember(id, data),
  delete: (id: number): Promise<boolean> => 
    api.database.deleteMember(id),
}

export const filmApi = {
  getList: (params?: PaginationParams): Promise<PaginatedResult<Film>> => 
    api.database.getFilms(params),
  getOne: (id: number): Promise<Film & { processRecords: ProcessRecord[] }> => 
    api.database.getFilm(id),
  create: (data: Omit<Film, 'id' | 'createdAt' | 'updatedAt' | 'reworkCount'>): Promise<number> => 
    api.database.createFilm(data),
  update: (id: number, data: Partial<Film>): Promise<boolean> => 
    api.database.updateFilm(id, data),
  delete: (id: number): Promise<boolean> => 
    api.database.deleteFilm(id),
  checkDuplicate: (filmNo: string, excludeId?: number): Promise<boolean> => 
    api.database.checkFilmDuplicate(filmNo, excludeId),
}

export const processApi = {
  getList: (params?: PaginationParams): Promise<PaginatedResult<ProcessRecord>> => 
    api.database.getProcessRecords(params),
  create: (data: Omit<ProcessRecord, 'id' | 'timestamp'>): Promise<number> => 
    api.database.createProcessRecord(data),
}

export const reminderApi = {
  getList: (params?: PaginationParams): Promise<PaginatedResult<Reminder>> => 
    api.database.getReminders(params),
  dismiss: (id: number): Promise<boolean> => 
    api.database.dismissReminder(id),
}

export const auditApi = {
  getList: (params?: PaginationParams): Promise<PaginatedResult<AuditLog>> => 
    api.database.getAuditLogs(params),
}

export const dashboardApi = {
  getStats: (): Promise<DashboardStats> => 
    api.database.getDashboardStats(),
}

export const importExportApi = {
  batchImportFilms: (data: any[]): Promise<{ success: number; failed: number; errors: string[] }> => 
    api.database.batchImportFilms(data),
  exportData: (type: 'films' | 'members' | 'process'): Promise<string> => 
    api.database.exportData(type),
  backupDatabase: (): Promise<string> => 
    api.database.backupDatabase(),
  restoreDatabase: (filePath: string): Promise<boolean> => 
    api.database.restoreDatabase(filePath),
}

export const dialogApi = {
  showOpenDialog: (options: any): Promise<any> => 
    api.dialog.showOpenDialog(options),
  showSaveDialog: (options: any): Promise<any> => 
    api.dialog.showSaveDialog(options),
  showMessageBox: (options: any): Promise<any> => 
    api.dialog.showMessageBox(options),
}
