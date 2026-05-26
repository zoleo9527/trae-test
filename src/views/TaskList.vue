<template>
  <div class="task-list">
    <div class="flex-between mb-20">
      <h1 class="page-title">作业任务</h1>
      <button v-if="currentUser.role !== 'operator'" class="btn btn-primary" @click="showAddModal = true">
        + 新建任务
      </button>
    </div>
    
    <div class="card">
      <div class="filter-bar">
        <select v-model="filterStatus" class="form-select" style="width: 120px">
          <option value="">全部状态</option>
          <option value="pending">待执行</option>
          <option value="progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="delayed">已延误</option>
        </select>
        <input 
          v-model="searchKeyword" 
          type="text" 
          class="form-input" 
          placeholder="搜索地块、机手..."
          style="width: 240px"
        />
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>地块</th>
            <th>作业类型</th>
            <th>机手</th>
            <th>计划日期</th>
            <th>进度</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id" @click="goToDetail(task.id)">
            <td>{{ task.plotName }}</td>
            <td>{{ task.type }}</td>
            <td>{{ task.operatorName }}</td>
            <td>{{ task.planDate }}</td>
            <td>
              <div class="progress-cell">
                <div class="progress-bar-small">
                  <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
                </div>
                <span>{{ task.progress }}%</span>
              </div>
            </td>
            <td>
              <span :class="['status-tag', `status-${task.status}`]">
                {{ getStatusText(task.status) }}
              </span>
            </td>
            <td>
              <button class="btn btn-default btn-sm" @click.stop="goToDetail(task.id)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredTasks.length === 0" class="empty-state">
        暂无任务数据
      </div>
    </div>
    
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建任务</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">选择地块</label>
            <select v-model="newTask.plotId" class="form-select" @change="onPlotChange">
              <option value="">请选择地块</option>
              <option v-for="plot in plots" :key="plot.id" :value="plot.id">
                {{ plot.name }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">作业类型</label>
            <select v-model="newTask.type" class="form-select">
              <option value="耕地">耕地</option>
              <option value="播种">播种</option>
              <option value="收割">收割</option>
              <option value="施肥">施肥</option>
              <option value="灌溉">灌溉</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">指派机手</label>
            <select v-model="newTask.operatorId" class="form-select" @change="onOperatorChange">
              <option value="">请选择机手</option>
              <option v-for="op in operators" :key="op.id" :value="op.id">
                {{ op.name }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">计划日期</label>
            <input v-model="newTask.planDate" type="date" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">备注</label>
            <textarea v-model="newTask.remark" class="form-textarea" placeholder="可选"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAddTask">确认创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useTaskStore } from '../stores/task'
import { usePlotStore } from '../stores/plot'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const taskStore = useTaskStore()
const plotStore = usePlotStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const plots = computed(() => plotStore.plots)
const operators = computed(() => userStore.users.filter(u => u.role === 'operator'))

const filterStatus = ref('')
const searchKeyword = ref('')
const showAddModal = ref(false)

const newTask = ref({
  plotId: '',
  plotName: '',
  type: '耕地',
  operatorId: '',
  operatorName: '',
  planDate: '',
  remark: ''
})

const filteredTasks = computed(() => {
  let tasks = [...taskStore.tasks]
  
  if (currentUser.value.role === 'operator') {
    tasks = tasks.filter(t => t.operatorId === currentUser.value.id)
  }
  
  if (filterStatus.value) {
    tasks = tasks.filter(t => t.status === filterStatus.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    tasks = tasks.filter(t => 
      t.plotName.toLowerCase().includes(keyword) || 
      t.operatorName.toLowerCase().includes(keyword)
    )
  }
  
  return tasks
})

function getStatusText(status) {
  const map = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
  return map[status] || status
}

function goToDetail(id) {
  router.push(`/tasks/${id}`)
}

function onPlotChange() {
  const plot = plots.value.find(p => p.id === newTask.value.plotId)
  if (plot) {
    newTask.value.plotName = plot.name
  }
}

function onOperatorChange() {
  const op = operators.value.find(o => o.id === newTask.value.operatorId)
  if (op) {
    newTask.value.operatorName = op.name
  }
}

async function handleAddTask() {
  if (!newTask.value.plotId || !newTask.value.operatorId || !newTask.value.planDate) {
    toastStore.error('请填写完整信息')
    return
  }
  
  await taskStore.addTask({ ...newTask.value }, currentUser.value)
  toastStore.success('任务创建成功')
  showAddModal.value = false
  newTask.value = { plotId: '', plotName: '', type: '耕地', operatorId: '', operatorName: '', planDate: '', remark: '' }
}

onMounted(async () => {
  await taskStore.loadTasks()
  await plotStore.loadPlots()
  await userStore.loadUsers()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-small {
  width: 80px;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
}

.table tbody tr {
  cursor: pointer;
}

.table tbody tr:hover {
  background: #f5f7fa;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 480px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
