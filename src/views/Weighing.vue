<template>
  <div>
    <div class="toolbar no-print">
      <el-button v-if="canWeigh" type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新增过磅
      </el-button>
      <el-button @click="handleBatchPrint" :disabled="selected.length === 0">
        <el-icon><Printer /></el-icon>
        批量打印
      </el-button>
      <div class="spacer"></div>
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索车牌号、磅单号" 
        style="width: 200px"
        clearable
        @keyup.enter="loadData"
      />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px"
      />
      <el-button @click="loadData">
        <el-icon><Search /></el-icon>
        查询
      </el-button>
    </div>

    <el-card class="table-container">
      <el-table :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="weighing_no" label="磅单号" width="150" />
        <el-table-column prop="plate_number" label="车牌号" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="goToVehicle(row.vehicle_id)">
              {{ row.plate_number }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="material_name" label="物料" width="100" />
        <el-table-column prop="gross_weight" label="毛重(kg)" width="100" />
        <el-table-column prop="tare_weight" label="皮重(kg)" width="100" />
        <el-table-column prop="net_weight" label="净重(kg)" width="100" />
        <el-table-column prop="unit_price" label="单价(元)" width="100" />
        <el-table-column prop="total_amount" label="金额(元)" width="110">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold">
              ¥{{ row.total_amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', 'status-' + row.status]">
              {{ statusText[row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="过磅时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
            <el-button link type="primary" @click="printReceipt(row)">打印</el-button>
            <el-button 
              v-if="row.status === 'pending' && canCancel" 
              link type="danger" 
              @click="cancelWeighing(row)"
            >
              作废
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="loadData"
        style="margin-top: 15px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增过磅" width="600px" @close="resetForm">
      <el-form :model="weighingForm" :rules="weighingRules" ref="weighingFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plate_number">
              <el-input 
                v-model="weighingForm.plate_number" 
                placeholder="输入车牌号"
                @blur="fetchVehicleInfo"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="司机姓名">
              <el-input v-model="weighingForm.driver_name" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="物料" prop="material_id">
          <el-select v-model="weighingForm.material_id" style="width: 100%" @change="updatePrice">
            <el-option 
              v-for="m in materials" 
              :key="m.id" 
              :label="`${m.name} (${m.current_price}元/kg)`" 
              :value="m.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="毛重(kg)" prop="gross_weight">
              <el-input-number 
                v-model="weighingForm.gross_weight" 
                :min="0" 
                :precision="2"
                style="width: 100%"
                @change="calculateNet"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="皮重(kg)" prop="tare_weight">
              <el-input-number 
                v-model="weighingForm.tare_weight" 
                :min="0" 
                :precision="2"
                style="width: 100%"
                @change="calculateNet"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="净重(kg)">
              <el-input :model-value="weighingForm.net_weight" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元/kg)">
              <el-input-number 
                v-model="weighingForm.unit_price" 
                :min="0" 
                :precision="2"
                style="width: 100%"
                @change="calculateAmount"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="预估金额">
          <span style="font-size: 24px; color: #f56c6c; font-weight: bold">
            ¥{{ weighingForm.total_amount.toFixed(2) }}
          </span>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="weighingForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWeighing" :loading="submitting">
          确认过磅
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const tableData = ref([])
const searchKeyword = ref('')
const dateRange = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selected = ref([])
const addDialogVisible = ref(false)
const submitting = ref(false)
const weighingFormRef = ref(null)
const materials = ref([])

const statusText = {
  pending: '待结算',
  settled: '已结算',
  cancelled: '已作废'
}

const canWeigh = computed(() => ['owner', 'weigher'].includes(authStore.user?.role))
const canCancel = computed(() => ['owner', 'weigher'].includes(authStore.user?.role))

function goToVehicle(vehicleId) {
  router.push({ path: '/vehicles', query: { highlight: vehicleId } })
}

const weighingForm = reactive({
  plate_number: '',
  driver_name: '',
  vehicle_id: null,
  material_id: null,
  gross_weight: 0,
  tare_weight: 0,
  net_weight: 0,
  unit_price: 0,
  total_amount: 0,
  remarks: ''
})

const weighingRules = {
  plate_number: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  material_id: [{ required: true, message: '请选择物料', trigger: 'change' }],
  gross_weight: [{ required: true, message: '请输入毛重', trigger: 'blur' }],
  tare_weight: [{ required: true, message: '请输入皮重', trigger: 'blur' }]
}

function calculateNet() {
  weighingForm.net_weight = Math.max(0, weighingForm.gross_weight - weighingForm.tare_weight)
  calculateAmount()
}

function calculateAmount() {
  weighingForm.total_amount = weighingForm.net_weight * weighingForm.unit_price
}

function updatePrice() {
  const material = materials.value.find(m => m.id === weighingForm.material_id)
  if (material) {
    weighingForm.unit_price = material.current_price
    calculateAmount()
  }
}

async function fetchVehicleInfo() {
  if (!weighingForm.plate_number) return
  
  const result = await db.query(
    'SELECT * FROM vehicles WHERE plate_number = ?',
    [weighingForm.plate_number]
  )
  
  if (result.success && result.data.length > 0) {
    const vehicle = result.data[0]
    weighingForm.driver_name = vehicle.driver_name || ''
    weighingForm.vehicle_id = vehicle.id
    if (vehicle.tare_weight) {
      weighingForm.tare_weight = vehicle.tare_weight
      calculateNet()
    }
  }
}

function showAddDialog() {
  addDialogVisible.value = true
}

function resetForm() {
  Object.assign(weighingForm, {
    plate_number: '',
    driver_name: '',
    vehicle_id: null,
    material_id: null,
    gross_weight: 0,
    tare_weight: 0,
    net_weight: 0,
    unit_price: 0,
    total_amount: 0,
    remarks: ''
  })
  weighingFormRef.value?.resetFields()
}

async function submitWeighing() {
  const valid = await weighingFormRef.value.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    if (!weighingForm.vehicle_id) {
      const vehicleResult = await db.query(
        'INSERT INTO vehicles (plate_number, driver_name, tare_weight) VALUES (?, ?, ?)',
        [weighingForm.plate_number, weighingForm.driver_name, weighingForm.tare_weight]
      )
      weighingForm.vehicle_id = vehicleResult.data.lastInsertRowid
    }
    
    const weighingNo = 'WB' + dayjs().format('YYYYMMDDHHmmss')
    const result = await db.query(
      `INSERT INTO weighings 
       (weighing_no, vehicle_id, material_id, gross_weight, tare_weight, net_weight, 
        unit_price, total_amount, weigher_id, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [weighingNo, weighingForm.vehicle_id, weighingForm.material_id,
       weighingForm.gross_weight, weighingForm.tare_weight, weighingForm.net_weight,
       weighingForm.unit_price, weighingForm.total_amount, authStore.user.id, weighingForm.remarks]
    )
    
    await db.log('create', 'weighings', result.data.lastInsertRowid, null, weighingForm)
    
    if (Math.abs(weighingForm.unit_price - materials.value.find(m => m.id === weighingForm.material_id)?.current_price) > 0.01) {
      await db.logException('price_deviation', result.data.lastInsertRowid, 
        `过磅单${weighingNo}单价与当前定价不符`, 'warning')
    }
    
    ElMessage.success('过磅登记成功')
    addDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  let sql = `
    SELECT w.*, v.plate_number, m.name as material_name
    FROM weighings w
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    LEFT JOIN materials m ON w.material_id = m.id
    WHERE 1=1
  `
  const params = []
  
  if (searchKeyword.value) {
    sql += ' AND (w.weighing_no LIKE ? OR v.plate_number LIKE ?)'
    params.push(`%${searchKeyword.value}%`, `%${searchKeyword.value}%`)
  }
  
  if (dateRange.value?.length === 2) {
    sql += ' AND DATE(w.created_at) BETWEEN ? AND ?'
    params.push(dateRange.value[0], dateRange.value[1])
  }
  
  sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?'
  params.push(pageSize.value, (page.value - 1) * pageSize.value)
  
  const result = await db.query(sql, params)
  if (result.success) {
    tableData.value = result.data
  }
  
  const countResult = await db.query('SELECT COUNT(*) as count FROM weighings')
  if (countResult.success) {
    total.value = countResult.data[0].count
  }
}

function handleSelectionChange(selection) {
  selected.value = selection
}

function viewDetail(row) {
  router.push(`/weighing/detail/${row.id}`)
}

function printReceipt(row) {
  const printContent = `
    <div style="width: 300px; padding: 20px; font-family: monospace;">
      <h3 style="text-align: center; margin: 0;">废品回收站过磅单</h3>
      <p style="text-align: center; font-size: 12px;">${row.weighing_no}</p>
      <hr style="margin: 10px 0;">
      <p>车牌号: ${row.plate_number}</p>
      <p>物料: ${row.material_name}</p>
      <p>毛重: ${row.gross_weight} kg</p>
      <p>皮重: ${row.tare_weight} kg</p>
      <p>净重: ${row.net_weight} kg</p>
      <p>单价: ${row.unit_price} 元/kg</p>
      <p style="font-weight: bold;">金额: ${row.total_amount.toFixed(2)} 元</p>
      <hr style="margin: 10px 0;">
      <p>过磅时间: ${row.created_at}</p>
      <p style="text-align: center; margin-top: 20px;">-- 签字确认 --</p>
    </div>
  `
  
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.print()
}

function handleBatchPrint() {
  selected.value.forEach(row => printReceipt(row))
}

async function cancelWeighing(row) {
  try {
    await ElMessageBox.confirm('确定要作废此过磅单吗？', '提示', { type: 'warning' })
    
    await db.query('UPDATE weighings SET status = ? WHERE id = ?', ['cancelled', row.id])
    await db.log('cancel', 'weighings', row.id, row, { status: 'cancelled' })
    
    ElMessage.success('已作废')
    loadData()
  } catch {}
}

async function loadMaterials() {
  const result = await db.query('SELECT * FROM materials WHERE is_active = 1')
  if (result.success) {
    materials.value = result.data
  }
}

onMounted(() => {
  loadData()
  loadMaterials()
})
</script>
