<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待结算过磅单" name="pending">
        <div class="toolbar no-print">
          <el-button type="primary" @click="batchSettle" :disabled="selectedWeighings.length === 0">
            <el-icon><Money /></el-icon>
            批量结算 ({{ selectedWeighings.length }}单)
          </el-button>
          <el-button @click="selectAllVisible">全选当前页</el-button>
          <div class="spacer"></div>
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索车牌号、磅单号" 
            style="width: 200px"
            clearable
            @keyup.enter="loadPendingWeighings"
          />
          <el-select v-model="filterMaterial" placeholder="物料筛选" style="width: 120px" clearable>
            <el-option v-for="m in materials" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-button @click="loadPendingWeighings">查询</el-button>
        </div>

        <el-card class="table-container">
          <el-table 
            :data="pendingWeighings" 
            border 
            stripe 
            @selection-change="handleWeighingSelection"
            ref="weighingTable"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="weighing_no" label="磅单号" width="150" />
            <el-table-column prop="plate_number" label="车牌号" width="100" />
            <el-table-column prop="material_name" label="物料" width="100" />
            <el-table-column prop="net_weight" label="净重(kg)" width="100" />
            <el-table-column prop="unit_price" label="单价(元)" width="100" />
            <el-table-column prop="total_amount" label="金额(元)" width="120">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold">
                  ¥{{ row.total_amount.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="price_anomaly" label="异常" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.price_anomaly" type="danger" size="small">价格异常</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="过磅时间" width="160" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewWeighingDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div style="margin-top: 15px; padding: 10px; background: #f5f7fa; border-radius: 4px;">
            <span>已选 <strong>{{ selectedWeighings.length }}</strong> 单，</span>
            <span>合计重量: <strong>{{ totalWeight.toFixed(2) }} kg</strong>，</span>
            <span>合计金额: <strong style="color: #f56c6c; font-size: 18px">¥{{ totalAmount.toFixed(2) }}</strong></span>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="结算记录" name="records">
        <div class="toolbar no-print">
          <el-button @click="exportSettlements">
            <el-icon><Download /></el-icon>
            导出结算单
          </el-button>
          <div class="spacer"></div>
          <el-input 
            v-model="settlementSearch" 
            placeholder="搜索结算单号" 
            style="width: 200px"
            clearable
            @keyup.enter="loadSettlements"
          />
          <el-date-picker
            v-model="settlementDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
          <el-select v-model="settlementStatus" placeholder="状态" style="width: 120px" clearable>
            <el-option label="待复核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已付款" value="paid" />
          </el-select>
          <el-button @click="loadSettlements">查询</el-button>
        </div>

        <el-card class="table-container">
          <el-table :data="settlements" border stripe>
            <el-table-column prop="settlement_no" label="结算单号" width="150" />
            <el-table-column prop="weighing_count" label="过磅单数" width="100" />
            <el-table-column prop="total_weight" label="总重(kg)" width="110" />
            <el-table-column prop="total_amount" label="应收(元)" width="110" />
            <el-table-column prop="deduction" label="扣款(元)" width="100" />
            <el-table-column prop="actual_amount" label="实付(元)" width="120">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold">
                  ¥{{ row.actual_amount.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="['status-tag', 'status-' + row.status]">
                  {{ settlementStatusText[row.status] }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewSettlementDetail(row)">查看</el-button>
                <el-button v-if="row.status === 'pending' && isOwner" link type="success" @click="approveSettlement(row)">复核通过</el-button>
                <el-button v-if="row.status === 'pending' && isOwner" link type="danger" @click="rejectSettlement(row)">驳回</el-button>
                <el-button v-if="row.status === 'approved'" link type="primary" @click="markPaid(row)">标记付款</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="settleDialogVisible" title="批量结算" width="600px">
      <el-alert 
        title="请仔细核对以下信息，结算后过磅单将自动标记为已结算" 
        type="warning" 
        :closable="false"
        style="margin-bottom: 20px"
      />
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="过磅单数">{{ selectedWeighings.length }}</el-descriptions-item>
        <el-descriptions-item label="合计重量">{{ totalWeight.toFixed(2) }} kg</el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span style="color: #f56c6c; font-weight: bold; font-size: 18px">
            ¥{{ totalAmount.toFixed(2) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <el-form :model="settlementForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="扣款金额(元)">
          <el-input-number 
            v-model="settlementForm.deduction" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="扣款原因">
          <el-input v-model="settlementForm.deduction_reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="付款方式">
          <el-select v-model="settlementForm.payment_method" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="settlementForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <div style="margin-top: 20px; padding: 15px; background: #f0f9eb; border-radius: 4px">
        <strong>实付金额: ¥{{ (totalAmount - settlementForm.deduction).toFixed(2) }}</strong>
      </div>
      
      <template #footer>
        <el-button @click="settleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSettlement" :loading="settling">
          确认结算
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('pending')
const searchKeyword = ref('')
const filterMaterial = ref(null)
const pendingWeighings = ref([])
const selectedWeighings = ref([])
const materials = ref([])
const weighingTable = ref(null)

const settlementSearch = ref('')
const settlementDateRange = ref([])
const settlementStatus = ref(null)
const settlements = ref([])

const settleDialogVisible = ref(false)
const settling = ref(false)
const settlementForm = reactive({
  deduction: 0,
  deduction_reason: '',
  payment_method: 'cash',
  remarks: ''
})

const isOwner = computed(() => authStore.user?.role === 'owner')

const settlementStatusText = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已付款'
}

const totalWeight = computed(() => {
  return selectedWeighings.value.reduce((sum, w) => sum + w.net_weight, 0)
})

const totalAmount = computed(() => {
  return selectedWeighings.value.reduce((sum, w) => sum + w.total_amount, 0)
})

async function loadPendingWeighings() {
  let sql = `
    SELECT w.*, v.plate_number, m.name as material_name, m.current_price
    FROM weighings w
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    LEFT JOIN materials m ON w.material_id = m.id
    WHERE w.status = 'pending'
  `
  const params = []
  
  if (searchKeyword.value) {
    sql += ' AND (w.weighing_no LIKE ? OR v.plate_number LIKE ?)'
    params.push(`%${searchKeyword.value}%`, `%${searchKeyword.value}%`)
  }
  
  if (filterMaterial.value) {
    sql += ' AND w.material_id = ?'
    params.push(filterMaterial.value)
  }
  
  sql += ' ORDER BY w.created_at DESC'
  
  const result = await db.query(sql, params)
  if (result.success) {
    pendingWeighings.value = result.data.map(w => ({
      ...w,
      price_anomaly: Math.abs(w.unit_price - w.current_price) > 0.01
    }))
  }
}

function handleWeighingSelection(selection) {
  selectedWeighings.value = selection
}

function selectAllVisible() {
  weighingTable.value?.toggleAllSelection()
}

function viewWeighingDetail(row) {
  router.push(`/weighing/detail/${row.id}`)
}

function batchSettle() {
  if (selectedWeighings.value.length === 0) {
    ElMessage.warning('请选择要结算的过磅单')
    return
  }
  settleDialogVisible.value = true
}

async function confirmSettlement() {
  settling.value = true
  try {
    const settlementNo = 'ST' + dayjs().format('YYYYMMDDHHmmss')
    const weighingIds = selectedWeighings.value.map(w => w.id).join(',')
    const actualAmount = totalAmount.value - settlementForm.deduction
    
    const result = await db.query(
      `INSERT INTO settlements 
       (settlement_no, weighing_ids, total_weight, total_amount, actual_amount, 
        deduction, deduction_reason, payment_method, accountant_id, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [settlementNo, weighingIds, totalWeight.value, totalAmount.value, actualAmount,
       settlementForm.deduction, settlementForm.deduction_reason, 
       settlementForm.payment_method, authStore.user.id, settlementForm.remarks]
    )
    
    for (const w of selectedWeighings.value) {
      await db.query('UPDATE weighings SET status = ? WHERE id = ?', ['settled', w.id])
    }
    
    await db.log('create', 'settlements', result.data.lastInsertRowid, null, {
      settlementNo,
      weighingIds,
      totalAmount: totalAmount.value,
      actualAmount
    })
    
    if (settlementForm.deduction > 0) {
      await db.logException('deduction', result.data.lastInsertRowid, 
        `结算单${settlementNo}扣款${settlementForm.deduction}元，原因：${settlementForm.deduction_reason}`, 'warning')
    }
    
    ElMessage.success('结算成功，等待复核')
    settleDialogVisible.value = false
    selectedWeighings.value = []
    loadPendingWeighings()
  } finally {
    settling.value = false
  }
}

async function loadSettlements() {
  let sql = `
    SELECT s.*, 
      (LENGTH(s.weighing_ids) - LENGTH(REPLACE(s.weighing_ids, ',', '')) + 1) as weighing_count
    FROM settlements s
    WHERE 1=1
  `
  const params = []
  
  if (settlementSearch.value) {
    sql += ' AND s.settlement_no LIKE ?'
    params.push(`%${settlementSearch.value}%`)
  }
  
  if (settlementStatus.value) {
    sql += ' AND s.status = ?'
    params.push(settlementStatus.value)
  }
  
  if (settlementDateRange.value?.length === 2) {
    sql += ' AND DATE(s.created_at) BETWEEN ? AND ?'
    params.push(settlementDateRange.value[0], settlementDateRange.value[1])
  }
  
  sql += ' ORDER BY s.created_at DESC'
  
  const result = await db.query(sql, params)
  if (result.success) {
    settlements.value = result.data
  }
}

function viewSettlementDetail(row) {
  router.push(`/settlement/detail/${row.id}`)
}

async function approveSettlement(row) {
  try {
    await ElMessageBox.confirm('确认通过此结算单？', '提示', { type: 'success' })
    
    await db.query('UPDATE settlements SET status = ?, reviewer_id = ? WHERE id = ?', 
      ['approved', authStore.user.id, row.id])
    await db.log('approve', 'settlements', row.id, row, { status: 'approved' })
    
    ElMessage.success('已通过')
    loadSettlements()
  } catch {}
}

async function rejectSettlement(row) {
  try {
    const reason = prompt('请输入驳回原因：')
    if (!reason) return
    
    await db.query('UPDATE settlements SET status = ?, reviewer_id = ?, remarks = ? WHERE id = ?', 
      ['rejected', authStore.user.id, reason, row.id])
    await db.log('reject', 'settlements', row.id, row, { status: 'rejected', reason })
    
    const weighingIds = row.weighing_ids.split(',')
    for (const id of weighingIds) {
      await db.query('UPDATE weighings SET status = ? WHERE id = ?', ['pending', id])
    }
    
    ElMessage.success('已驳回')
    loadSettlements()
  } catch {}
}

async function markPaid(row) {
  try {
    await ElMessageBox.confirm('确认已付款？', '提示', { type: 'info' })
    
    await db.query('UPDATE settlements SET status = ?, payment_time = ? WHERE id = ?', 
      ['paid', dayjs().format('YYYY-MM-DD HH:mm:ss'), row.id])
    await db.log('paid', 'settlements', row.id, row, { status: 'paid' })
    
    ElMessage.success('已标记付款')
    loadSettlements()
  } catch {}
}

function exportSettlements() {
  const data = settlements.value.map(s => ({
    '结算单号': s.settlement_no,
    '过磅单数': s.weighing_count,
    '总重量(kg)': s.total_weight,
    '应收金额(元)': s.total_amount,
    '扣款(元)': s.deduction,
    '实付金额(元)': s.actual_amount,
    '状态': settlementStatusText[s.status],
    '创建时间': s.created_at
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '结算记录')
  XLSX.writeFile(wb, `结算记录_${dayjs().format('YYYYMMDD')}.xlsx`)
}

async function loadMaterials() {
  const result = await db.query('SELECT * FROM materials WHERE is_active = 1')
  if (result.success) {
    materials.value = result.data
  }
}

onMounted(() => {
  loadPendingWeighings()
  loadSettlements()
  loadMaterials()
})
</script>
