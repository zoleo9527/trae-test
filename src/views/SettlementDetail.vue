<template>
  <div>
    <div class="toolbar">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <el-button type="primary" @click="printSettlement">
        <el-icon><Printer /></el-icon>
        打印结算单
      </el-button>
    </div>

    <el-card v-if="settlement">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>结算单详情 - {{ settlement.settlement_no }}</span>
          <span :class="['status-tag', 'status-' + settlement.status]">
            {{ statusText[settlement.status] }}
          </span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="过磅单数">{{ weighingIds.length }}</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ settlement.total_weight.toFixed(2) }} kg</el-descriptions-item>
        <el-descriptions-item label="应收金额">
          <span style="color: #f56c6c">¥{{ settlement.total_amount.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="扣款金额">
          <span v-if="settlement.deduction > 0" style="color: #e6a23c">-¥{{ settlement.deduction.toFixed(2) }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="扣款原因" v-if="settlement.deduction > 0" :span="2">
          {{ settlement.deduction_reason }}
        </el-descriptions-item>
        <el-descriptions-item label="实付金额" :span="2">
          <span style="font-size: 28px; font-weight: bold; color: #f56c6c">
            ¥{{ settlement.actual_amount.toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="付款方式">{{ paymentMethodText[settlement.payment_method] }}</el-descriptions-item>
        <el-descriptions-item label="财务">{{ accountant?.name }}</el-descriptions-item>
        <el-descriptions-item label="复核人" v-if="reviewer">{{ reviewer.name }}</el-descriptions-item>
        <el-descriptions-item label="付款时间" v-if="settlement.payment_time">
          {{ settlement.payment_time }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ settlement.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ settlement.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>关联过磅单</el-divider>
      
      <el-table :data="weighings" border stripe size="small">
        <el-table-column prop="weighing_no" label="磅单号" width="150" />
        <el-table-column prop="plate_number" label="车牌号" width="100" />
        <el-table-column prop="material_name" label="物料" width="100" />
        <el-table-column prop="net_weight" label="净重(kg)" width="100" />
        <el-table-column prop="unit_price" label="单价(元)" width="100" />
        <el-table-column prop="total_amount" label="金额(元)" width="120">
          <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/weighing/detail/${row.id}`)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import db from '@/utils/db'

const route = useRoute()
const id = route.params.id

const settlement = ref(null)
const weighings = ref([])
const accountant = ref(null)
const reviewer = ref(null)

const weighingIds = computed(() => {
  if (!settlement.value) return []
  return settlement.value.weighing_ids.split(',')
})

const statusText = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已付款'
}

const paymentMethodText = {
  cash: '现金',
  bank: '银行转账',
  wechat: '微信',
  alipay: '支付宝'
}

async function loadData() {
  const sResult = await db.query('SELECT * FROM settlements WHERE id = ?', [id])
  if (sResult.success && sResult.data.length > 0) {
    settlement.value = sResult.data[0]
    
    if (settlement.value.accountant_id) {
      const aResult = await db.query('SELECT * FROM users WHERE id = ?', [settlement.value.accountant_id])
      accountant.value = aResult.data?.[0]
    }
    
    if (settlement.value.reviewer_id) {
      const rResult = await db.query('SELECT * FROM users WHERE id = ?', [settlement.value.reviewer_id])
      reviewer.value = rResult.data?.[0]
    }
    
    const ids = settlement.value.weighing_ids
    const wResult = await db.query(`
      SELECT w.*, v.plate_number, m.name as material_name
      FROM weighings w
      LEFT JOIN vehicles v ON w.vehicle_id = v.id
      LEFT JOIN materials m ON w.material_id = m.id
      WHERE w.id IN (${ids})
    `)
    if (wResult.success) {
      weighings.value = wResult.data
    }
  }
}

function printSettlement() {
  if (!settlement.value || weighings.value.length === 0) return
  
  let itemsHtml = weighings.value.map((w, i) => `
    <tr>
      <td style="padding: 5px; border: 1px solid #ddd;">${i + 1}</td>
      <td style="padding: 5px; border: 1px solid #ddd;">${w.weighing_no}</td>
      <td style="padding: 5px; border: 1px solid #ddd;">${w.plate_number}</td>
      <td style="padding: 5px; border: 1px solid #ddd;">${w.material_name}</td>
      <td style="padding: 5px; border: 1px solid #ddd; text-align: right;">${w.net_weight}</td>
      <td style="padding: 5px; border: 1px solid #ddd; text-align: right;">${w.unit_price}</td>
      <td style="padding: 5px; border: 1px solid #ddd; text-align: right;">${w.total_amount.toFixed(2)}</td>
    </tr>
  `).join('')
  
  const printContent = `
    <div style="width: 800px; padding: 20px; font-family: monospace;">
      <h2 style="text-align: center; margin: 0;">废品回收站结算单</h2>
      <p style="text-align: center; font-size: 14px;">${settlement.value.settlement_no}</p>
      <hr style="margin: 20px 0;">
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f7fa;">
            <th style="padding: 8px; border: 1px solid #ddd; width: 50px;">序号</th>
            <th style="padding: 8px; border: 1px solid #ddd;">磅单号</th>
            <th style="padding: 8px; border: 1px solid #ddd;">车牌号</th>
            <th style="padding: 8px; border: 1px solid #ddd;">物料</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 80px;">净重</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 80px;">单价</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 100px;">金额</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; text-align: right; font-size: 16px;">
        <p>合计重量: <strong>${settlement.value.total_weight.toFixed(2)} kg</strong></p>
        <p>应收金额: <strong>¥${settlement.value.total_amount.toFixed(2)}</strong></p>
        ${settlement.value.deduction > 0 ? `<p>扣款: <strong style="color: #e6a23c;">-¥${settlement.value.deduction.toFixed(2)}</strong></p>` : ''}
        <p style="font-size: 20px;">实付金额: <strong style="color: #f56c6c;">¥${settlement.value.actual_amount.toFixed(2)}</strong></p>
      </div>
      
      <div style="margin-top: 30px; display: flex; justify-content: space-between;">
        <p>财务: _______________</p>
        <p>复核: _______________</p>
        <p>收款人: _______________</p>
      </div>
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
