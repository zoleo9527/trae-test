<template>
  <div class="lockers-page">
    <div class="page-header">
      <div class="filter-bar">
        <div class="filter-group">
          <span class="filter-label">区域:</span>
          <button
            v-for="zone in allZones"
            :key="zone"
            class="filter-btn"
            :class="{ active: selectedZone === zone }"
            @click="selectedZone = zone"
          >
            {{ zone }}
          </button>
        </div>
        <div class="filter-group">
          <span class="filter-label">状态:</span>
          <button
            v-for="status in statusOptions"
            :key="status.value"
            class="filter-btn"
            :class="{ active: selectedStatus === status.value }"
            @click="selectedStatus = status.value"
          >
            {{ status.label }}
          </button>
        </div>
      </div>
      <button class="btn btn-primary" @click="showAssignModal = true">
        + 分配储物柜
      </button>
    </div>
    
    <div class="locker-grid card">
      <div class="locker-grid-header">
        <div class="zone-title">{{ selectedZone }} 区</div>
        <div class="locker-legend">
          <span class="legend-item"><span class="dot available"></span>空闲</span>
          <span class="legend-item"><span class="dot occupied"></span>使用中</span>
          <span class="legend-item"><span class="dot maintenance"></span>维护中</span>
          <span class="legend-item"><span class="dot damaged"></span>损坏</span>
        </div>
      </div>
      <div class="locker-grid-body">
        <div
          v-for="locker in filteredLockers"
          :key="locker.id"
          class="locker-cell"
          :class="locker.status"
          @click="handleLockerClick(locker)"
        >
          <div class="locker-no">{{ locker.locker_no }}</div>
          <div v-if="locker.status === 'occupied'" class="locker-badge">
            {{ getAssignmentForLocker(locker.id)?.member_name || getAssignmentForLocker(locker.id)?.guest_name || '使用中' }}
          </div>
        </div>
        <div v-if="!filteredLockers.length" class="empty-state">
          <div class="empty-icon">🔐</div>
          <div class="empty-text">该区域暂无储物柜</div>
        </div>
      </div>
    </div>
    
    <div class="assignments-section card">
      <div class="card-header">
        <h3>当前使用记录</h3>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>储物柜</th>
            <th>使用人</th>
            <th>类型</th>
            <th>分配时间</th>
            <th>操作人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="assignment in activeAssignments" :key="assignment.id">
            <td><span class="tag">{{ assignment.locker_no }}</span></td>
            <td>{{ assignment.member_name || assignment.guest_name || '未知' }}</td>
            <td>
              <span class="badge" :class="assignTypeClass(assignment.assign_type)">
                {{ assignTypeLabels[assignment.assign_type] }}
              </span>
            </td>
            <td>{{ formatDateTime(assignment.assigned_at) }}</td>
            <td>{{ assignment.operator_name || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="handleRelease(assignment.id)">
                释放
              </button>
            </td>
          </tr>
          <tr v-if="!activeAssignments.length">
            <td colspan="6">
              <div class="empty-state">
                <div class="empty-text">暂无使用记录</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">分配储物柜</div>
          <button class="btn-ghost" @click="showAssignModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="label">分配类型</label>
            <select v-model="assignForm.type" class="select">
              <option value="member">会员</option>
              <option value="guest">散客</option>
              <option value="temporary">临时使用</option>
            </select>
          </div>
          
          <div class="form-group" v-if="assignForm.type === 'member'">
            <label class="label">会员卡号</label>
            <select v-model="assignForm.member_id" class="select">
              <option :value="null">请选择会员</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.member_no }} - {{ m.name }} (余额: ¥{{ m.balance }})
              </option>
            </select>
          </div>
          
          <div class="form-group" v-else>
            <label class="label">使用人姓名</label>
            <input v-model="assignForm.guest_name" type="text" class="input" placeholder="请输入姓名" />
          </div>
          
          <div class="form-group">
            <label class="label">选择储物柜</label>
            <div class="available-lockers">
              <div
                v-for="locker in availableLockers"
                :key="locker.id"
                class="locker-option"
                :class="{ selected: assignForm.locker_id === locker.id }"
                @click="assignForm.locker_id = locker.id"
              >
                {{ locker.locker_no }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAssignModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAssign" :disabled="!canAssign">
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dbApi from '@/db'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const lockers = ref<any[]>([])
const activeAssignments = ref<any[]>([])
const members = ref<any[]>([])
const selectedZone = ref('A')
const selectedStatus = ref<string>('all')
const showAssignModal = ref(false)

const assignForm = ref({
  type: 'member' as 'member' | 'guest' | 'temporary',
  member_id: null as number | null,
  guest_name: '',
  locker_id: null as number | null
})

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'available', label: '空闲' },
  { value: 'occupied', label: '使用中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'damaged', label: '损坏' }
]

const assignTypeLabels: Record<string, string> = {
  member: '会员',
  guest: '散客',
  temporary: '临时'
}

const allZones = computed(() => {
  const zones = new Set(lockers.value.map(l => l.zone))
  return Array.from(zones).sort()
})

const filteredLockers = computed(() => {
  return lockers.value.filter(l => {
    if (l.zone !== selectedZone.value) return false
    if (selectedStatus.value !== 'all' && l.status !== selectedStatus.value) return false
    return true
  })
})

const availableLockers = computed(() => {
  return lockers.value.filter(l => l.status === 'available')
})

const canAssign = computed(() => {
  if (!assignForm.value.locker_id) return false
  if (assignForm.value.type === 'member' && !assignForm.value.member_id) return false
  if (assignForm.value.type !== 'member' && !assignForm.value.guest_name.trim()) return false
  return true
})

function assignTypeClass(type: string): string {
  const map: Record<string, string> = {
    member: 'badge-info',
    guest: 'badge-warning',
    temporary: 'badge-muted'
  }
  return map[type] || 'badge-muted'
}

function getAssignmentForLocker(lockerId: number) {
  return activeAssignments.value.find(a => a.locker_id === lockerId)
}

function formatDateTime(ts: number): string {
  return dayjs(ts).format('MM-DD HH:mm')
}

function handleLockerClick(locker: any) {
  if (locker.status === 'available') {
    assignForm.value.locker_id = locker.id
    showAssignModal.value = true
  }
}

async function handleAssign() {
  if (!canAssign.value || !userStore.currentUser) return
  
  await dbApi.assignLocker(
    assignForm.value.locker_id!,
    assignForm.value.type,
    userStore.currentUser.id,
    assignForm.value.type === 'member' ? assignForm.value.member_id! : undefined,
    assignForm.value.type !== 'member' ? assignForm.value.guest_name : undefined
  )
  
  showAssignModal.value = false
  resetAssignForm()
  await loadData()
}

async function handleRelease(assignmentId: number) {
  if (!confirm('确认释放该储物柜?')) return
  await dbApi.releaseLocker(assignmentId)
  await loadData()
}

function resetAssignForm() {
  assignForm.value = {
    type: 'member',
    member_id: null,
    guest_name: '',
    locker_id: null
  }
}

async function loadData() {
  lockers.value = await dbApi.getLockers()
  activeAssignments.value = await dbApi.getActiveLockerAssignments()
  members.value = await dbApi.getMembers()
  
  if (!allZones.value.includes(selectedZone.value) && allZones.value.length > 0) {
    selectedZone.value = allZones.value[0]
  }
}

onMounted(loadData)
</script>

<style scoped>
.lockers-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: #64748b;
}

.filter-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.3);
}

.locker-grid {
  padding: 0;
}

.locker-grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.zone-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.locker-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.available { background: #4ade80; }
.dot.occupied { background: #60a5fa; }
.dot.maintenance { background: #fcd34d; }
.dot.damaged { background: #f87171; }

.locker-grid-body {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.locker-cell {
  aspect-ratio: 1;
  border-radius: 10px;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 8px;
  text-align: center;
}

.locker-cell.available {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.2);
}

.locker-cell.available:hover {
  background: rgba(34, 197, 94, 0.15);
  transform: translateY(-2px);
}

.locker-cell.occupied {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
  cursor: default;
}

.locker-cell.maintenance {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.25);
  cursor: default;
}

.locker-cell.damaged {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
  cursor: default;
}

.locker-no {
  font-size: 15px;
  font-weight: 600;
  color: inherit;
}

.locker-cell.available .locker-no { color: #4ade80; }
.locker-cell.occupied .locker-no { color: #60a5fa; }
.locker-cell.maintenance .locker-no { color: #fcd34d; }
.locker-cell.damaged .locker-no { color: #f87171; }

.locker-badge {
  font-size: 10px;
  color: #94a3b8;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assignments-section {
  padding: 0;
}

.form-group {
  margin-bottom: 16px;
}

.available-lockers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
}

.locker-option {
  padding: 10px;
  text-align: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 6px;
  font-size: 13px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.locker-option:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(59, 130, 246, 0.3);
}

.locker-option.selected {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #fff;
}
</style>
