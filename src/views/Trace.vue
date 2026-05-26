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
              <div v-if="traceData.weighing">
                <p>磅单号: {{ traceData.weighing.weighing_no }}</p>
                <p>车牌号: {{ traceData.vehicle?.plate_number }}</p>
                <p>物料: {{ traceData.material?.name }}</p>
                <p>净重: {{ traceData.weighing.net_weight }} kg</p>
                <p>单价: {{ traceData.weighing.unit_price }} 元/kg</p>
                <p>金额: ¥{{ traceData.weighing.total_amount.toFixed(2) }}</p>
                <p>过磅员: {{ traceData.weigher?.name }}</p>
                <p>时间: {{ traceData.weighing.created_at }}</p>
                <el-button link type="primary" @click="$router.push(`/weighing/detail/${traceData.weighing.id}`)">
                  查看磅单详情
                </el-button>
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
                <p>实付: ¥{{ traceData.settlement.actual_amount.toFixed(2) }}</p>
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
            <p style="color: #909399; font-size: 12px; margin-top: 5px">{{ log.table_name }} #{{ log.record_id }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>

      <el-empty v-else-if="!searching && searched" description="未找到相关记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import db from '@/utils/db'

const searchNo = ref('')
const searching = ref(false)
const searched = ref(false)
const traceData = ref(null)

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

async function searchTrace() {
  if (!searchNo.value.trim()) return
  
  searching.value = true
  searched.value = true
  
  try {
    let weighing = null
    let settlement = null
    
    if (searchNo.value.startsWith('WB')) {
      const wResult = await db.query(`
        SELECT w.* FROM weighings w WHERE w.weighing_no = ?
      `, [searchNo.value])
      if (wResult.success && wResult.data.length > 0) {
        weighing = wResult.data[0]
        
        const sResult = await db.query(`
          SELECT s.*, 
            (LENGTH(s.weighing_ids) - LENGTH(REPLACE(s.weighing_ids, ',', '')) + 1) as weighing_count
          FROM settlements s 
          WHERE ',' || s.weighing_ids || ',' LIKE '%,' || ? || ',%'
          ORDER BY s.created_at DESC LIMIT 1
        `, [weighing.id])
        if (sResult.success && sResult.data.length > 0) {
          settlement = sResult.data[0]
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
        
        const firstWeighingId = settlement.weighing_ids.split(',')[0]
        const wResult = await db.query(`
          SELECT w.* FROM weighings w WHERE w.id = ?
        `, [firstWeighingId])
        if (wResult.success && wResult.data.length > 0) {
          weighing = wResult.data[0]
        }
      }
    }
    
    if (weighing) {
      const vehicleResult = await db.query('SELECT * FROM vehicles WHERE id = ?', [weighing.vehicle_id])
      const materialResult = await db.query('SELECT * FROM materials WHERE id = ?', [weighing.material_id])
      const weigherResult = await db.query('SELECT * FROM users WHERE id = ?', [weighing.weigher_id])
      
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
      
      const recordIds = [weighing.id]
      if (settlement) recordIds.push(settlement.id)
      
      const logsResult = await db.query(`
        SELECT l.*, u.name as user_name
        FROM operation_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.record_id IN (${recordIds.join(',')})
        ORDER BY l.created_at DESC
      `)
      
      traceData.value = {
        weighing,
        settlement,
        vehicle: vehicleResult.data?.[0],
        material: materialResult.data?.[0],
        weigher: weigherResult.data?.[0],
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
