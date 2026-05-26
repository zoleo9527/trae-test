<template>
  <div class="subsidy-records">
    <div class="flex-between mb-20">
      <h1 class="page-title">补贴申请</h1>
      <button class="btn btn-primary" @click="showAddModal = true">+ 新建申请</button>
    </div>
    
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div>
          <div class="stat-value">{{ subsidyStats.total }}</div>
          <div class="stat-label">申请总数</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div>
          <div class="stat-value">¥{{ subsidyStats.approvedAmount }}</div>
          <div class="stat-label">已批金额</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">⏳</div>
        <div>
          <div class="stat-value">{{ subsidyStats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>地块</th>
            <th>补贴类型</th>
            <th>申请金额</th>
            <th>申请日期</th>
            <th>材料</th>
            <th>状态</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.plotName }}</td>
            <td>{{ record.subsidyType }}</td>
            <td class="text-success">¥{{ record.amount }}</td>
            <td>{{ record.applyDate }}</td>
            <td>
              <div class="material-tags">
                <span v-for="m in record.materials" :key="m" class="material-tag has">{{ m }}</span>
              </div>
              <div v-if="record.missingDocs && record.missingDocs.length > 0" class="missing-docs">
                <span class="missing-label">缺失:</span>
                <span v-for="m in record.missingDocs" :key="m" class="material-tag missing">{{ m }}</span>
              </div>
            </td>
            <td>
              <span :class="['status-tag', `status-${record.status}`]">
                {{ getStatusText(record.status) }}
              </span>
            </td>
            <td style="max-width: 150px;">{{ record.remark || '-' }}</td>
            <td>
              <div class="action-btns">
                <button 
                  v-if="record.status === 'pending' && currentUser.role === 'director'" 
                  class="btn btn-success btn-sm" 
                  @click="handleApprove(record.id)"
                >
                  通过
                </button>
                <button 
                  v-if="record.status === 'pending' && currentUser.role === 'director'" 
                  class="btn btn-danger btn-sm" 
                  @click="handleReject(record.id)"
                >
                  驳回
                </button>
                <button 
                  v-if="currentUser.role === 'dispatcher'" 
                  class="btn btn-primary btn-sm" 
                  @click="openSupplementModal(record)"
                >
                  补交材料
                </button>
              </div>
              <span v-if="record.status !== 'pending' && currentUser.role !== 'dispatcher'" class="text-muted">-</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="records.length === 0" class="empty-state">
        暂无补贴申请
      </div>
    </div>
    
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建补贴申请</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label class="form-label">选择地块</label>
            <select v-model="newRecord.plotId" class="form-select" @change="onPlotChange">
              <option value="">请选择地块</option>
              <option v-for="plot in plots" :key="plot.id" :value="plot.id">
                {{ plot.name }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">补贴类型</label>
            <select v-model="newRecord.subsidyType" class="form-select">
              <option value="农机作业补贴">农机作业补贴</option>
              <option value="种粮补贴">种粮补贴</option>
              <option value="耕地保护补贴">耕地保护补贴</option>
              <option value="其他补贴">其他补贴</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">申请金额(元)</label>
            <input v-model.number="newRecord.amount" type="number" class="form-input" min="0" />
          </div>
          <div class="form-item">
            <label class="form-label">提交材料</label>
            <div class="checkbox-group">
              <label v-for="m in materialOptions" :key="m" class="checkbox-item">
                <input type="checkbox" :value="m" v-model="newRecord.materials" />
                <span>{{ m }}</span>
              </label>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">备注</label>
            <textarea v-model="newRecord.remark" class="form-textarea" placeholder="可选"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAddRecord">提交申请</button>
        </div>
      </div>
    </div>
    
    <div v-if="showSupplementModal" class="modal-overlay" @click.self="showSupplementModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>补交材料 - {{ supplementRecord?.plotName }}</h3>
          <button class="close-btn" @click="showSupplementModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="material-status">
            <div class="status-row">
              <span class="status-label">当前状态:</span>
              <span :class="['status-tag', `status-${supplementRecord?.status}`]">
                {{ getStatusText(supplementRecord?.status) }}
              </span>
            </div>
            <div class="status-row" v-if="supplementRecord?.missingDocs?.length > 0">
              <span class="status-label">缺失材料:</span>
              <span class="material-tag missing">{{ supplementRecord.missingDocs.join('、') }}</span>
            </div>
          </div>
          
          <div class="form-item">
            <label class="form-label">已提交材料</label>
            <div class="checkbox-group">
              <label v-for="m in materialOptions" :key="m" class="checkbox-item">
                <input type="checkbox" :value="m" v-model="supplementForm.materials" />
                <span>{{ m }}</span>
              </label>
            </div>
          </div>
          
          <div class="form-item">
            <label class="form-label">补充备注</label>
            <textarea v-model="supplementForm.remark" class="form-textarea" placeholder="说明补交情况（可选）"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showSupplementModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSupplement">确认更新</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useSubsidyStore } from '../stores/subsidy'
import { usePlotStore } from '../stores/plot'
import { useAlertStore } from '../stores/alert'
import { useToastStore } from '../stores/toast'

const userStore = useUserStore()
const subsidyStore = useSubsidyStore()
const plotStore = usePlotStore()
const alertStore = useAlertStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const records = computed(() => subsidyStore.records)
const subsidyStats = computed(() => subsidyStore.stats)
const plots = computed(() => plotStore.plots)

const showAddModal = ref(false)
const showSupplementModal = ref(false)
const materialOptions = ['作业单', '验收单', '身份证复印件', '土地承包证', '其他']

const newRecord = ref({
  plotId: '',
  plotName: '',
  subsidyType: '农机作业补贴',
  amount: 0,
  materials: [],
  remark: '',
  applyDate: new Date().toISOString().split('T')[0]
})

const supplementRecord = ref(null)
const supplementForm = ref({
  materials: [],
  remark: ''
})

function getStatusText(status) {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

function onPlotChange() {
  const plot = plots.value.find(p => p.id === newRecord.value.plotId)
  if (plot) {
    newRecord.value.plotName = plot.name
  }
}

async function handleAddRecord() {
  if (!newRecord.value.plotId || !newRecord.value.amount) {
    toastStore.error('请填写完整信息')
    return
  }
  
  await subsidyStore.addRecord({ ...newRecord.value }, currentUser.value)
  toastStore.success('申请已提交')
  showAddModal.value = false
  newRecord.value = {
    plotId: '',
    plotName: '',
    subsidyType: '农机作业补贴',
    amount: 0,
    materials: [],
    remark: '',
    applyDate: new Date().toISOString().split('T')[0]
  }
}

async function handleApprove(id) {
  await subsidyStore.updateRecord(id, { 
    status: 'approved', 
    approveDate: new Date().toISOString().split('T')[0] 
  }, currentUser.value)
  toastStore.success('已通过审批')
}

async function handleReject(id) {
  await subsidyStore.updateRecord(id, { 
    status: 'rejected',
    approveDate: new Date().toISOString().split('T')[0]
  }, currentUser.value)
  toastStore.info('已驳回申请')
}

function openSupplementModal(record) {
  supplementRecord.value = record
  supplementForm.value = {
    materials: [...(record.materials || [])],
    remark: ''
  }
  showSupplementModal.value = true
}

async function handleSupplement() {
  if (!supplementRecord.value) return
  
  await subsidyStore.updateRecord(
    supplementRecord.value.id, 
    { 
      materials: supplementForm.value.materials,
      remark: supplementForm.value.remark || supplementRecord.value.remark
    }, 
    currentUser.value
  )
  
  toastStore.success('材料已更新')
  showSupplementModal.value = false
  supplementRecord.value = null
}

onMounted(async () => {
  await subsidyStore.loadRecords()
  await plotStore.loadPlots()
  await alertStore.loadAlerts()
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

.stat-card.success {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
}

.stat-card.success .stat-value,
.stat-card.success .stat-label {
  color: #fff;
}

.stat-card.warning {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  color: #fff;
}

.stat-card.warning .stat-value,
.stat-card.warning .stat-label {
  color: #fff;
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

.material-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.material-tag {
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
}

.material-tag.has {
  background: #f6ffed;
  color: #52c41a;
}

.material-tag.missing {
  background: #fff1f0;
  color: #ff4d4f;
}

.missing-docs {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.missing-label {
  font-size: 11px;
  color: #ff4d4f;
  font-weight: 500;
}

.action-btns {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
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
  max-height: 80vh;
  overflow-y: auto;
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

.status-approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.material-status {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-row:last-child {
  margin-bottom: 0;
}

.status-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
</style>
