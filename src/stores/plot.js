import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'

export const usePlotStore = defineStore('plot', () => {
  const plots = ref([])
  const loading = ref(false)

  async function loadPlots() {
    loading.value = true
    const data = await storage.get('plots')
    if (data) {
      plots.value = data
    }
    loading.value = false
  }

  async function addPlot(plot) {
    const newPlot = {
      id: 'p' + Date.now(),
      ...plot,
      status: 'pending',
      createTime: new Date().toISOString().split('T')[0]
    }
    plots.value.push(newPlot)
    await storage.set('plots', plots.value)
    return newPlot
  }

  async function updatePlot(id, updates) {
    const index = plots.value.findIndex(p => p.id === id)
    if (index !== -1) {
      plots.value[index] = { ...plots.value[index], ...updates }
      await storage.set('plots', plots.value)
    }
  }

  function getPlotById(id) {
    return computed(() => plots.value.find(p => p.id === id))
  }

  const stats = computed(() => {
    const total = plots.value.length
    const completed = plots.value.filter(p => p.status === 'completed').length
    const progress = plots.value.filter(p => p.status === 'progress').length
    const pending = plots.value.filter(p => p.status === 'pending').length
    const delayed = plots.value.filter(p => p.status === 'delayed').length
    const totalArea = plots.value.reduce((sum, p) => sum + p.area, 0)

    return { total, completed, progress, pending, delayed, totalArea }
  })

  return {
    plots,
    loading,
    loadPlots,
    addPlot,
    updatePlot,
    getPlotById,
    stats
  }
})
