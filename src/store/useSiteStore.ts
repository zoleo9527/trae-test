import { create } from 'zustand'
import type { Site, Device, InspectionTask } from '@/types'
import { mockSites } from '@/mock/sites'
import { mockDevices } from '@/mock/devices'
import { mockInspections } from '@/mock/inspections'

interface SiteState {
  sites: Site[]
  devices: Device[]
  inspections: InspectionTask[]
  loading: boolean
  fetchSites: () => Promise<void>
  fetchDevices: (siteId?: string) => Promise<void>
  fetchInspections: () => Promise<void>
  updateInspectionItem: (
    inspectionId: string,
    itemId: string,
    data: Partial<InspectionTask['items'][0]>
  ) => void
  startInspection: (id: string) => void
  completeInspection: (id: string) => void
}

export const useSiteStore = create<SiteState>((set) => ({
  sites: [],
  devices: [],
  inspections: [],
  loading: false,
  fetchSites: async () => {
    set({ loading: true })
    await new Promise((r) => setTimeout(r, 200))
    set({ sites: mockSites, loading: false })
  },
  fetchDevices: async (siteId) => {
    set({ loading: true })
    await new Promise((r) => setTimeout(r, 200))
    let result = mockDevices
    if (siteId) {
      result = mockDevices.filter((d) => d.siteId === siteId)
    }
    set({ devices: result, loading: false })
  },
  fetchInspections: async () => {
    set({ loading: true })
    await new Promise((r) => setTimeout(r, 200))
    set({ inspections: mockInspections, loading: false })
  },
  updateInspectionItem: (inspectionId, itemId, data) => {
    set((state) => ({
      inspections: state.inspections.map((insp) =>
        insp.id === inspectionId
          ? {
              ...insp,
              items: insp.items.map((item) =>
                item.id === itemId ? { ...item, ...data } : item
              ),
            }
          : insp
      ),
    }))
  },
  startInspection: (id) => {
    set((state) => ({
      inspections: state.inspections.map((insp) =>
        insp.id === id
          ? { ...insp, status: 'in_progress', startedAt: new Date().toISOString() }
          : insp
      ),
    }))
  },
  completeInspection: (id) => {
    set((state) => ({
      inspections: state.inspections.map((insp) =>
        insp.id === id
          ? { ...insp, status: 'completed', completedAt: new Date().toISOString() }
          : insp
      ),
    }))
  },
}))
