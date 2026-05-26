import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'
import { usePlotStore } from './plot'
import { useAlertStore } from './alert'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([])
  const loading = ref(false)

  async function loadTasks() {
    loading.value = true
    const data = await storage.get('tasks')
    if (data) {
      tasks.value = data
    }
    loading.value = false
  }

  async function addTask(task, operator) {
    const newTask = {
      id: 't' + Date.now(),
      ...task,
      status: 'pending',
      progress: 0,
      fuelUsed: 0,
      actualDate: null,
      createTime: new Date().toLocaleString('zh-CN')
    }
    tasks.value.push(newTask)
    await storage.set('tasks', tasks.value)
    
    await addHistoryLog({
      type: 'task',
      action: 'create',
      targetId: newTask.id,
      targetName: `${task.plotName}-${task.type}任务`,
      content: `创建了${task.type}任务，计划日期：${task.planDate}`,
      operatorId: operator.id,
      operatorName: operator.name
    })

    const plotStore = usePlotStore()
    await plotStore.loadPlots()
    await plotStore.updatePlot(task.plotId, { status: 'pending' })
    
    return newTask
  }

  async function updateTask(id, updates, operator = null) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const oldTask = tasks.value[index]
      tasks.value[index] = { ...oldTask, ...updates }
      await storage.set('tasks', tasks.value)

      const plotStore = usePlotStore()
      const alertStore = useAlertStore()

      if (updates.status && updates.status !== oldTask.status) {
        const statusMap = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
        
        if (operator) {
          await addHistoryLog({
            type: 'task',
            action: 'status_change',
            targetId: id,
            targetName: `${oldTask.plotName}-${oldTask.type}任务`,
            content: `任务状态从【${statusMap[oldTask.status]}】变为【${statusMap[updates.status]}】`,
            operatorId: operator.id,
            operatorName: operator.name
          })
        }

        await plotStore.loadPlots()
        
        if (updates.status === 'delayed') {
          await plotStore.updatePlot(oldTask.plotId, { status: 'delayed' })
          
          await alertStore.loadAlerts()
          const existingAlert = alertStore.alerts.find(
            a => a.type === 'delay' && a.relatedId === id
          )
          if (!existingAlert) {
            await alertStore.addAlert({
              type: 'delay',
              title: '作业进度延误',
              content: `${oldTask.plotName}${oldTask.type}作业已延误，机手：${oldTask.operatorName}`,
              relatedId: id,
              relatedType: 'task',
              assignee: operator?.id || 'u2'
            })
            
            await addHistoryLog({
              type: 'alert',
              action: 'create',
              targetId: `delay-${id}`,
              targetName: '作业进度延误提醒',
              content: `系统自动生成延误提醒：${oldTask.plotName}-${oldTask.type}`,
              operatorId: 'system',
              operatorName: '系统'
            })
          }
        } else if (updates.status === 'progress') {
          await plotStore.updatePlot(oldTask.plotId, { status: 'progress' })
        } else if (updates.status === 'completed') {
          const plotTasks = tasks.value.filter(t => t.plotId === oldTask.plotId)
          const allCompleted = plotTasks.every(t => t.status === 'completed' || t.id === id)
          await plotStore.updatePlot(oldTask.plotId, { status: allCompleted ? 'completed' : 'progress' })
          
          await alertStore.loadAlerts()
          const pendingAlerts = alertStore.alerts.filter(
            a => a.type === 'delay' && a.relatedId === id && a.status !== 'handled'
          )
          for (const alert of pendingAlerts) {
            await alertStore.markAsRead(alert.id, operator)
          }
        }
      }

      if (updates.progress && updates.progress !== oldTask.progress) {
        await plotStore.loadPlots()
        const plotTasks = tasks.value.filter(t => t.plotId === oldTask.plotId)
        const avgProgress = plotTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / plotTasks.length
        
        const plot = plotStore.plots.find(p => p.id === oldTask.plotId)
        if (plot && plot.status !== 'delayed') {
          if (avgProgress >= 100) {
            await plotStore.updatePlot(oldTask.plotId, { status: 'completed' })
          } else if (avgProgress > 0) {
            await plotStore.updatePlot(oldTask.plotId, { status: 'progress' })
          }
        }
      }

      if (operator && updates.remark) {
        await addHistoryLog({
          type: 'task',
          action: 'remark',
          targetId: id,
          targetName: `${oldTask.plotName}-${oldTask.type}任务`,
          content: `添加备注：${updates.remark}`,
          operatorId: operator.id,
          operatorName: operator.name
        })
      }
    }
  }

  function getTaskById(id) {
    return computed(() => tasks.value.find(t => t.id === id))
  }

  function getTasksByPlotId(plotId) {
    return computed(() => tasks.value.filter(t => t.plotId === plotId))
  }

  function getTasksByOperatorId(operatorId) {
    return computed(() => tasks.value.filter(t => t.operatorId === operatorId))
  }

  const stats = computed(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.status === 'completed').length
    const progress = tasks.value.filter(t => t.status === 'progress').length
    const pending = tasks.value.filter(t => t.status === 'pending').length
    const delayed = tasks.value.filter(t => t.status === 'delayed').length
    const totalFuel = tasks.value.reduce((sum, t) => sum + (t.fuelUsed || 0), 0)

    return { total, completed, progress, pending, delayed, totalFuel }
  })

  return {
    tasks,
    loading,
    loadTasks,
    addTask,
    updateTask,
    getTaskById,
    getTasksByPlotId,
    getTasksByOperatorId,
    stats
  }
})
