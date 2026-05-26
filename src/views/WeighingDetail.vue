<template>
  <div>
    <div class="toolbar">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <el-button type="primary" @click="printReceipt">
        <el-icon><Printer /></el-icon>
        打印磅单
      </el-button>
    </div>

    <el-card v-if="weighing">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>磅单详情 - {{ weighing.weighing_no }}</span>
          <span :class="['status-tag', 'status-' + weighing.status]">
            {{ statusText[weighing.status] }}
          </span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="车牌号">{{ vehicle?.plate_number }}</el-descriptions-item>
        <el-descriptions-item label="司机姓名">{{ vehicle?.driver_name }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ material?.name }}</el-descriptions-item>
        <el-descriptions-item label="物料分类">{{ material?.category }}</el-descriptions-item>
        <el-descriptions-item label="毛重">{{ weighing.gross_weight }} kg</el-descriptions-item>
        <el-descriptions-item label="皮重">{{ weighing.tare_weight }} kg</el-descriptions-item>
        <el-descriptions-item label="净重" :span="2">
          <span style="font-size: 24px; font-weight: bold; color: #409eff">
            {{ weighing.net_weight }} kg
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="单价">{{ weighing.unit_price }} 元/kg</el-descriptions-item>
        <el-descriptions-item label="总金额">
          <span style="font-size: 24px; font-weight: bold; color: #f56c6c">
            ¥{{ weighing.total_amount.toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="过磅员">{{ weigher?.name }}</el-descriptions-item>
        <el-descriptions-item label="过磅时间">{{ weighing.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ weighing.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>关联结算</el-divider>
      
      <el-table v-if="settlement" :data="[settlement]" size="small">
        <el-table-column prop="settlement_no" label="结算单号" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <span :class="['status-tag', 'status-' + row.status]">
              {{ settlementStatusText[row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额">
          <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="actual_amount" label="实付金额">
          <template #default="{ row }">¥{{ row.actual_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button 
              v-if="['owner', 'accountant'].includes(authStore.user?.role)" 
              link type="primary" 
              @click="$router.push(`/settlement/detail/${row.id}`)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="尚未结算" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import db from '@/utils/db'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const router = useRouter()

const route = useRoute()
const id = route.params.id

if (!['owner', 'weigher', 'accountant'].includes(authStore.user?.role)) {
  ElMessage.error('无权限访问此页面')
  router.replace('/')
}

const weighing = ref(null)
const vehicle = ref(null)
const material = ref(null)
const weigher = ref(null)
const settlement = ref(null)

const statusText = {
  pending: '待结算',
  settled: '已结算',
  cancelled: '已作废'
}

const settlementStatusText = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已付款'
}

async function loadData() {
  const wResult = await db.query('SELECT * FROM weighings WHERE id = ?', [id])
  if (wResult.success && wResult.data.length > 0) {
    weighing.value = wResult.data[0]
    
    const vResult = await db.query('SELECT * FROM vehicles WHERE id = ?', [weighing.value.vehicle_id])
    vehicle.value = vResult.data?.[0]
    
    const mResult = await db.query('SELECT * FROM materials WHERE id = ?', [weighing.value.material_id])
    material.value = mResult.data?.[0]
    
    const uResult = await db.query('SELECT * FROM users WHERE id = ?', [weighing.value.weigher_id])
    weigher.value = uResult.data?.[0]
    
    const sResult = await db.query(`
      SELECT * FROM settlements 
      WHERE ',' || weighing_ids || ',' LIKE '%,' || ? || ',%'
      ORDER BY created_at DESC LIMIT 1
    `, [id])
    settlement.value = sResult.data?.[0]
  }
}

function printReceipt() {
  if (!weighing.value) return
  
  const printContent = `
    <div style="width: 300px; padding: 20px; font-family: monospace;">
      <h3 style="text-align: center; margin: 0;">废品回收站过磅单</h3>
      <p style="text-align: center; font-size: 12px;">${weighing.value.weighing_no}</p>
      <hr style="margin: 10px 0;">
      <p>车牌号: ${vehicle.value?.plate_number}</p>
      <p>物料: ${material.value?.name}</p>
      <p>毛重: ${weighing.value.gross_weight} kg</p>
      <p>皮重: ${weighing.value.tare_weight} kg</p>
      <p>净重: ${weighing.value.net_weight} kg</p>
      <p>单价: ${weighing.value.unit_price} 元/kg</p>
      <p style="font-weight: bold;">金额: ${weighing.value.total_amount.toFixed(2)} 元</p>
      <hr style="margin: 10px 0;">
      <p>过磅时间: ${weighing.value.created_at}</p>
      <p style="text-align: center; margin-top: 20px;">-- 签字确认 --</p>
    </div>
  `
  
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.print()
}

onMounted(() => {
  loadData()
})
</script>
