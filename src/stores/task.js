import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'

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
    
    return newTask
  }

  async function updateTask(id, updates, operator = null) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const oldTask = tasks.value[index]
      tasks.value[index] = { ...oldTask, ...updates }
      await storage.set('tasks', tasks.value)

      if (operator && updates.status && updates.status !== oldTask.status) {
        const statusMap = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
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
