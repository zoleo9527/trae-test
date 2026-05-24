const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    get: (sql, params) => ipcRenderer.invoke('db:get', sql, params)
  },
  student: {
    timeline: (studentId) => ipcRenderer.invoke('student:timeline', studentId)
  },
  document: {
    newVersion: (docId, reviewNotes) => ipcRenderer.invoke('document:newVersion', docId, reviewNotes)
  },
  export: {
    receipt: (studentId) => ipcRenderer.invoke('export:receipt', studentId)
  },
  cache: {
    save: (key, data) => ipcRenderer.invoke('cache:save', key, data),
    get: (key) => ipcRenderer.invoke('cache:get', key)
  },
  print: {
    html: (html) => ipcRenderer.invoke('print:html', html)
  },
  dialog: {
    showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessageBox', options)
  }
});
