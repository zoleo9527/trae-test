import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  login: (username: string, password: string) => ipcRenderer.invoke('db:login', username, password),
  getUsers: () => ipcRenderer.invoke('db:getUsers'),
  
  createBatch: (data: any) => ipcRenderer.invoke('db:createBatch', data),
  getBatches: () => ipcRenderer.invoke('db:getBatches'),
  getBatchById: (id: number) => ipcRenderer.invoke('db:getBatchById', id),
  
  addClothes: (data: any) => ipcRenderer.invoke('db:addClothes', data),
  batchAddClothes: (list: any[]) => ipcRenderer.invoke('db:batchAddClothes', list),
  getClothesByBatch: (batchId: number) => ipcRenderer.invoke('db:getClothesByBatch', batchId),
  getClothesById: (id: number) => ipcRenderer.invoke('db:getClothesById', id),
  searchClothes: (keyword: string) => ipcRenderer.invoke('db:searchClothes', keyword),
  updateClothesStatus: (id: number, status: string, operatorId: number, operatorName: string) => 
    ipcRenderer.invoke('db:updateClothesStatus', id, status, operatorId, operatorName),
  
  reportDamage: (data: any) => ipcRenderer.invoke('db:reportDamage', data),
  getDamageRecords: (status?: string) => ipcRenderer.invoke('db:getDamageRecords', status),
  resolveDamage: (data: any) => ipcRenderer.invoke('db:resolveDamage', data),
  
  getOperationLogs: (clothesId?: number, batchId?: number) => 
    ipcRenderer.invoke('db:getOperationLogs', clothesId, batchId),
  
  saveCache: (key: string, data: string) => ipcRenderer.invoke('db:saveCache', key, data),
  getCache: (key: string) => ipcRenderer.invoke('db:getCache', key),
  clearCache: (key: string) => ipcRenderer.invoke('db:clearCache', key),
  
  getReturnOrders: (storeId?: number) => ipcRenderer.invoke('db:getReturnOrders', storeId),
  getReturnOrderById: (id: number) => ipcRenderer.invoke('db:getReturnOrderById', id),
  createReturnOrder: (data: any) => ipcRenderer.invoke('db:createReturnOrder', data),
  signReturnOrderItem: (data: any) => ipcRenderer.invoke('db:signReturnOrderItem', data),
  batchSignReturnOrder: (data: any) => ipcRenderer.invoke('db:batchSignReturnOrder', data),
  getClothesForReturn: (storeId?: number) => ipcRenderer.invoke('db:getClothesForReturn', storeId),
  
  selectDirectory: () => ipcRenderer.invoke('app:selectDirectory'),
  selectFile: () => ipcRenderer.invoke('app:selectFile'),
  showMessageBox: (options: any) => ipcRenderer.invoke('app:showMessageBox', options)
})
