<template>
  <div>
    <el-card>
      <template #header>
        <div class="toolbar">
          <span>追踪溯源 - 输入磅单号或结算单号追踪完整流程</span>
        </div>
      </template>
      
      <div style="display: flex; gap: 15px; margin-bottom: 20px">
        <el-input 
          v-model="searchNo" 
          placeholder="输入磅单号(WB开头)或结算单号(ST开头)" 
          style="flex: 1; max-width: 400px"
          clearable
        />
        <el-button type="primary" @click="searchTrace" :loading="searching">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>

      <div v-if="traceData" style="margin-top: 20px">
        <el-steps direction="vertical" :active="currentStep" finish-status="success">
          <el-step title="过磅登记">
            <template #description>
              <div v-if="traceData.weighings && traceData.weighings.length > 0">
                <p>共 <strong>{{ traceData.weighings.length }}</strong> 张过磅单</p>
                <el-table :data="traceData.weighings" size="small" style="margin-top: 10px">
                  <el-table-column prop="weighing_no" label="磅单号" width="150" />
                  <el-table-column prop="plate_number" label="车牌号" width="100">
                    <template #default="{ row }">
                      <el-button link type="primary" size="small" @click="goToVehicle(row.vehicle_id, row.plate_number)">
                        {{ row.plate_number }}
                      </el-button>
                    </template>
                  </el-table-column>
                  <el-table-column prop="material_name" label="物料" width="80" />
                  <el-table-column prop="net_weight" label="净重(kg)" width="100" />
                  <el-table-column prop="total_amount" label="金额" width="100">
                    <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column prop="weigher_name" label="过磅员" width="80" />
                  <el-table-column label="操作" width="80">
                    <template #default="{ row }">
                      <el-button link type="primary" size="small" @click="$router.push(`/weighing/detail/${row.id}`)">
                        详情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-step>
          
          <el-step title="结算处理" :status="traceData.settlement ? 'success' : 'wait'">
            <template #description>
              <div v-if="traceData.settlement">
                <p>结算单号: {{ traceData.settlement.settlement_no }}</p>
                <p>包含过磅单: {{ traceData.settlement.weighing_count }} 单</p>
                <p>总重量: {{ traceData.settlement.total_weight }} kg</p>
                <p>应收: ¥{{ traceData.settlement.total_amount.toFixed(2) }}</p>
                <p v-if="traceData.settlement.deduction > 0" style="color: #f56c6c">
                  扣款: ¥{{ traceData.settlement.deduction.toFixed(2) }} ({{ traceData.settlement.deduction_reason }})
                </p>
                <p>实付: <strong style="font-size: 18px; color: #f56c6c;">¥{{ traceData.settlement.actual_amount.toFixed(2) }}</strong></p>
                <p>财务: {{ traceData.accountant?.name }}</p>
                <p>时间: {{ traceData.settlement.created_at }}</p>
                <el-button link type="primary" @click="$router.push(`/settlement/detail/${traceData.settlement.id}`)">
                  查看结算详情
                </el-button>
              </div>
              <div v-else>
                <el-tag type="info">尚未结算</el-tag>
              </div>
            </template>
          </el-step>
          
          <el-step title="复核审批" :status="getReviewStatus()">
            <template #description>
              <div v-if="traceData.settlement">
                <p v-if="traceData.settlement.status === 'pending'">
                  <el-tag type="warning">待复核</el-tag>
                </p>
                <p v-else-if="traceData.settlement.status === 'approved'">
                  <el-tag type="success">已通过</el-tag>
                  <p>复核人: {{ traceData.reviewer?.name }}</p>
                </p>
                <p v-else-if="traceData.settlement.status === 'rejected'">
                  <el-tag type="danger">已驳回</el-tag>
                  <p>原因: {{ traceData.settlement.remarks }}</p>
                  <p>复核人: {{ traceData.reviewer?.name }}</p>
                </p>
                <p v-else-if="traceData.settlement.status === 'paid'">
                  <el-tag type="success">已付款</el-tag>
                  <p>付款时间: {{ traceData.settlement.payment_time }}</p>
                </p>
              </div>
            </template>
          </el-step>
        </el-steps>

        <el-divider>操作历史</el-divider>
        
        <el-timeline>
          <el-timeline-item 
            v-for="log in traceData.logs" 
            :key="log.id"
            :timestamp="log.created_at"
            :type="getLogType(log.operation)"
          >
            <strong>{{ log.user_name }}</strong> {{ getOperationText(log.operation) }}
            <p style="color: #909399; font-size: 12px; margin-top: 5px">
              {{ log.table_name }} #{{ log.record_id }}
              <span v-if="log.old_value" style="margin-left: 10px;">原值变更</span>
            </p>
          </el-timeline-item>
        </el-timeline>
      </div>

      <el-empty v-else-if="!searching && searched" description="未找到相关记录" />
    </el-card>

    <el-dialog v-model="vehicleHistoryVisible" :title="`${currentVehiclePlate} 过磅历史`" width="800px">
      <el-table :data="vehicleWeighings" border stripe size="small">
        <el-table-column prop="weighing_no" label="磅单号" width="150" />
        <el-table-column prop="material_name" label="物料" width="100" />
        <el-table-column prop="net_weight" label="净重(kg)" width="100" />
        <el-table-column prop="total_amount" label="金额(元)" width="120">
          <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', 'status-' + row.status]">
              {{ statusText[row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="过磅时间" width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'

const router = useRouter()
const authStore = useAuthStore()

const searchNo = ref('')
const searching = ref(false)
const searched = ref(false)
const traceData = ref(null)

const vehicleHistoryVisible = ref(false)
const currentVehiclePlate = ref('')
const vehicleWeighings = ref([])

const statusText = {
  pending: '待结算',
  settled: '已结算',
  cancelled: '已作废'
}

const canAccessVehicles = computed(() => ['owner', 'weigher'].includes(authStore.user?.role))

const currentStep = computed(() => {
  if (!traceData.value) return 0
  if (!traceData.value.settlement) return 1
  if (traceData.value.settlement.status === 'pending') return 2
  return 3
})

function getReviewStatus() {
  if (!traceData.value?.settlement) return 'wait'
  const s = traceData.value.settlement
  if (s.status === 'approved' || s.status === 'paid') return 'success'
  if (s.status === 'rejected') return 'error'
  return 'wait'
}

function getLogType(op) {
  if (['create', 'approve', 'paid'].includes(op)) return 'success'
  if (['cancel', 'reject'].includes(op)) return 'danger'
  if (['update'].includes(op)) return 'warning'
  return ''
}

function getOperationText(op) {
  const texts = {
    create: '创建了记录',
    update: '更新了记录',
    cancel: '作废了记录',
    approve: '审批通过',
    reject: '驳回了申请',
    paid: '确认付款',
    login: '登录系统'
  }
  return texts[op] || op
}

async function goToVehicle(vehicleId, plateNumber) {
  if (canAccessVehicles.value) {
    router.push({ path: '/vehicles', query: { highlight: vehicleId } })
  } else {
    await showVehicleHistory(vehicleId, plateNumber)
  }
}

async function showVehicleHistory(vehicleId, plateNumber) {
  currentVehiclePlate.value = plateNumber
  
  const result = await db.query(`
    SELECT w.*, m.name as material_name
    FROM weighings w
    LEFT JOIN materials m ON w.material_id = m.id
    WHERE w.vehicle_id = ?
    ORDER BY w.created_at DESC
  `, [vehicleId])
  
  if (result.success) {
    vehicleWeighings.value = result.data
  }
  vehicleHistoryVisible.value = true
}

async function searchTrace() {
  if (!searchNo.value.trim()) return
  
  searching.value = true
  searched.value = true
  
  try {
    let weighings = []
    let settlement = null
    
    if (searchNo.value.startsWith('WB')) {
      const wResult = await db.query(`
        SELECT w.*, v.plate_number, m.name as material_name, u.name as weigher_name
        FROM weighings w
        LEFT JOIN vehicles v ON w.vehicle_id = v.id
        LEFT JOIN materials m ON w.material_id = m.id
        LEFT JOIN users u ON w.weigher_id = u.id
        WHERE w.weighing_no = ?
      `, [searchNo.value])
      
      if (wResult.success && wResult.data.length > 0) {
        weighings = wResult.data
        
        const sResult = await db.query(`
          SELECT s.*, 
            (LENGTH(s.weighing_ids) - LENGTH(REPLACE(s.weighing_ids, ',', '')) + 1) as weighing_count
          FROM settlements s 
          WHERE ',' || s.weighing_ids || ',' LIKE '%,' || ? || ',%'
          ORDER BY s.created_at DESC LIMIT 1
        `, [weighings[0].id])
        
        if (sResult.success && sResult.data.length > 0) {
          settlement = sResult.data[0]
          
          const allWResult = await db.query(`
            SELECT w.*, v.plate_number, m.name as material_name, u.name as weigher_name
            FROM weighings w
            LEFT JOIN vehicles v ON w.vehicle_id = v.id
            LEFT JOIN materials m ON w.material_id = m.id
            LEFT JOIN users u ON w.weigher_id = u.id
            WHERE w.id IN (${settlement.weighing_ids})
            ORDER BY w.created_at DESC
          `)
          if (allWResult.success) {
            weighings = allWResult.data
          }
        }
      }
    } else if (searchNo.value.startsWith('ST')) {
      const sResult = await db.query(`
        SELECT s.*,
          (LENGTH(s.weighing_ids) - LENGTH(REPLACE(s.weighing_ids, ',', '')) + 1) as weighing_count
        FROM settlements s WHERE s.settlement_no = ?
      `, [searchNo.value])
      
      if (sResult.success && sResult.data.length > 0) {
        settlement = sResult.data[0]
        
        const wResult = await db.query(`
          SELECT w.*, v.plate_number, m.name as material_name, u.name as weigher_name
          FROM weighings w
          LEFT JOIN vehicles v ON w.vehicle_id = v.id
          LEFT JOIN materials m ON w.material_id = m.id
          LEFT JOIN users u ON w.weigher_id = u.id
          WHERE w.id IN (${settlement.weighing_ids})
          ORDER BY w.created_at DESC
        `)
        if (wResult.success) {
          weighings = wResult.data
        }
      }
    }
    
    if (weighings.length > 0) {
      let accountant = null
      let reviewer = null
      
      if (settlement) {
        if (settlement.accountant_id) {
          const accResult = await db.query('SELECT * FROM users WHERE id = ?', [settlement.accountant_id])
          accountant = accResult.data?.[0]
        }
        if (settlement.reviewer_id) {
          const revResult = await db.query('SELECT * FROM users WHERE id = ?', [settlement.reviewer_id])
          reviewer = revResult.data?.[0]
        }
      }
      
      const recordIds = weighings.map(w => w.id)
      if (settlement) recordIds.push(settlement.id)
      
      const logsResult = await db.query(`
        SELECT l.*, u.name as user_name
        FROM operation_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.record_id IN (${recordIds.join(',')})
        ORDER BY l.created_at DESC
      `)
      
      traceData.value = {
        weighings,
        settlement,
        accountant,
        reviewer,
        logs: logsResult.data || []
      }
    } else {
      traceData.value = null
    }
  } finally {
    searching.value = false
  }
}
</script>
