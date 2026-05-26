import { useAuthStore } from '@/stores/auth'

function hasElectron() {
  return typeof window !== 'undefined' && window.electron && window.electron.ipcRenderer
}

const db = {
  async query(sql, params = []) {
    if (hasElectron()) {
      return await window.electron.ipcRenderer.invoke('db-query', sql, params)
    } else {
      console.warn('Electron not available, using mock')
      console.log('SQL:', sql, params)
      return { success: true, data: [] }
    }
  },

  async exec(sql) {
    if (hasElectron()) {
      return await window.electron.ipcRenderer.invoke('db-exec', sql)
    } else {
      console.warn('Electron not available, using mock')
      console.log('SQL:', sql)
      return { success: true }
    }
  },

  async log(operation, tableName, recordId, oldValue, newValue) {
    const authStore = useAuthStore()
    if (!authStore.user) return
    
    await this.query(
      `INSERT INTO operation_logs (user_id, operation, table_name, record_id, old_value, new_value) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [authStore.user.id, operation, tableName, recordId, 
       oldValue ? JSON.stringify(oldValue) : null, 
       newValue ? JSON.stringify(newValue) : null]
    )
  },

  async logException(type, relatedId, description, severity = 'warning') {
    await this.query(
      `INSERT INTO exceptions (type, related_id, description, severity) 
       VALUES (?, ?, ?, ?)`,
      [type, relatedId, description, severity]
    )
  },

  findInSet(value, csvField) {
    return `',' || ${csvField} || ',' LIKE '%,' || ${value} || ',%'`
  }
}

export default db
