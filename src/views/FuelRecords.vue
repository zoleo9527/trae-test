<template>
  <div class="fuel-records">
    <div class="flex-between mb-20">
      <h1 class="page-title">油料管理</h1>
      <button class="btn btn-primary" @click="showAddModal = true">+ 加油登记</button>
    </div>
    
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">⛽</div>
        <div>
          <div class="stat-value">{{ fuelStats.totalAmount }}L</div>
          <div class="stat-label">总加油量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div>
          <div class="stat-value">¥{{ fuelStats.totalPrice }}</div>
          <div class="stat-label">总金额</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div>
          <div class="stat-value">{{ fuelStats.count }}</div>
          <div class="stat-label">加油次数</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>日期</th>
            <th>关联任务</th>
            <th>机手</th>
            <th>油品</th>
            <th>数量(L)</th>
            <th>单价(元)</th>
            <th>金额(元)</th>
            <th>登记人</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.fillDate }}</td>
            <td>{{ getTaskName(record.taskId) }}</td>
            <td>{{ record.operatorName }}</td>
            <td>{{ record.fuelType }}</td>
            <td>{{ record.amount }}</td>
            <td>{{ record.unitPrice }}</td>
            <td class="text-success">{{ record.totalPrice }}</td>
            <td>{{ getOperatorName(record.createBy) }}</td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="records.length === 0" class="empty-state">
        暂无加油记录
      </div>
    </div>
    
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>加油登记</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">关联任务</label>
            <select v-model="newRecord.taskId" class="form-select" @change="onTaskChange">
              <option value="">请选择任务</option>
              <option v-for="task in tasks" :key="task.id" :value="task.id">
                {{ task.plotName }} - {{ task.type }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">机手</label>
            <input v-model="newRecord.operatorName" type="text" class="form-input" readonly />
          </div>
          <div class="form-item">
            <label class="form-label">油品类型</label>
            <select v-model="newRecord.fuelType" class="form-select">
              <option value="柴油">柴油</option>
              <option value="汽油">汽油</option>
              <option value="润滑油">润滑油</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">加油数量(L)</label>
            <input v-model.number="newRecord.amount" type="number" class="form-input" min="0" />
          </div>
          <div class="form-item">
            <label class="form-label">单价(元/L)</label>
            <input v-model.number="newRecord.unitPrice" type="number" class="form-input" min="0" step="0.1" />
          </div>
          <div class="form-item">
            <label class="form-label">加油日期</label>
            <input v-model="newRecord.fillDate" type="date" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">预计金额</label>
            <div class="amount-preview">¥{{ (newRecord.amount * newRecord.unitPrice).toFixed(2) }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAddRecord">确认登记</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useFuelStore } from '../stores/fuel'
import { useTaskStore } from '../stores/task'
import { useToastStore } from '../stores/toast'

const userStore = useUserStore()
const fuelStore = useFuelStore()
const taskStore = useTaskStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const records = computed(() => fuelStore.records)
const fuelStats = computed(() => fuelStore.stats)
const tasks = computed(() => taskStore.tasks)

const showAddModal = ref(false)
const newRecord = ref({
  taskId: '',
  operatorId: '',
  operatorName: '',
  fuelType: '柴油',
  amount: 0,
  unitPrice: 7.5,
  fillDate: new Date().toISOString().split('T')[0]
})

function getTaskName(taskId) {
  const task = tasks.value.find(t => t.id === taskId)
  return task ? `${task.plotName} - ${task.type}` : '-'
}

function getOperatorName(userId) {
  const user = userStore.users.find(u => u.id === userId)
  return user ? user.name : '-'
}

function onTaskChange() {
  const task = tasks.value.find(t => t.id === newRecord.value.taskId)
  if (task) {
    newRecord.value.operatorId = task.operatorId
    newRecord.value.operatorName = task.operatorName
    newRecord.value.plotId = task.plotId
    newRecord.value.plotName = task.plotName
  }
}

async function handleAddRecord() {
  if (!newRecord.value.taskId || !newRecord.value.amount) {
    toastStore.error('请填写完整信息')
    return
  }
  
  await fuelStore.addRecord({ ...newRecord.value }, currentUser.value)
  toastStore.success('登记成功')
  showAddModal.value = false
  newRecord.value = {
    taskId: '',
    operatorId: '',
    operatorName: '',
    fuelType: '柴油',
    amount: 0,
    unitPrice: 7.5,
    fillDate: new Date().toISOString().split('T')[0]
  }
}

onMounted(async () => {
  await fuelStore.loadRecords()
  await taskStore.loadTasks()
  await userStore.loadUsers()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.amount-preview {
  padding: 12px;
  background: #f6ffed;
  border-radius: 6px;
  font-size: 20px;
  font-weight: 600;
  color: #52c41a;
  text-align: center;
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
