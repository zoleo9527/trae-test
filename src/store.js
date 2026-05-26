import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/tauri'

export const useStore = create((set, get) => ({
  currentRole: 'manager',
  currentView: 'workbench',
  selectedCustomer: null,
  showTransferModal: false,
  showAlertPanel: false,
  
  optometryRecords: [],
  lensInventory: [],
  transferOrders: [],
  processingRecords: [],
  repairRecords: [],
  refundRecords: [],
  stockAlerts: [],
  
  loading: false,
  error: null,

  setRole: (role) => set({ currentRole: role }),
  setView: (view) => set({ currentView: view }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setShowTransferModal: (show) => set({ showTransferModal: show }),
  setShowAlertPanel: (show) => set({ showAlertPanel: show }),

  loadAllData: async () => {
    set({ loading: true })
    try {
      const [optometry, inventory, transfers, processing, repairs, refunds, alerts] = await Promise.all([
        invoke('get_optometry_records'),
        invoke('get_lens_inventory'),
        invoke('get_transfer_orders'),
        invoke('get_processing_records'),
        invoke('get_repair_records'),
        invoke('get_refund_records'),
        invoke('get_stock_alerts'),
      ])
      set({
        optometryRecords: optometry,
        lensInventory: inventory,
        transferOrders: transfers,
        processingRecords: processing,
        repairRecords: repairs,
        refundRecords: refunds,
        stockAlerts: alerts,
        loading: false,
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createTransfer: async (data) => {
    try {
      const id = await invoke('create_transfer_order', data)
      await get().loadAllData()
      return id
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  updateTransferStatus: async (id, status) => {
    try {
      await invoke('update_transfer_status', { id, status })
      await get().loadAllData()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  acknowledgeAlert: async (alertId) => {
    try {
      await invoke('acknowledge_alert', { alertId })
      await get().loadAllData()
    } catch (error) {
      set({ error: error.message })
    }
  },

  approveRefund: async (id, approvedBy) => {
    try {
      await invoke('approve_refund', { id, approvedBy })
      await get().loadAllData()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  exportData: async () => {
    try {
      return await invoke('export_all_data')
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },
}))
