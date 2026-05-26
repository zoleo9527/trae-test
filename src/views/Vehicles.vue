<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新增车辆
      </el-button>
      <div class="spacer"></div>
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索车牌号、司机" 
        style="width: 200px"
        clearable
        @keyup.enter="loadData"
      />
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-card class="table-container">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="driver_name" label="司机姓名" width="120" />
        <el-table-column prop="driver_phone" label="联系电话" width="140" />
        <el-table-column prop="vehicle_type_text" label="车辆类型" width="120" />
        <el-table-column prop="tare_weight" label="皮重(kg)" width="120" />
        <el-table-column prop="weighing_count" label="过磅次数" width="100" />
        <el-table-column prop="last_weighing_at" label="最近过磅" width="160" />
        <el-table-column prop="created_at" label="登记时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewHistory(row)">过磅历史</el-button>
            <el-button link type="primary" @click="editVehicle(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteVehicle(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑车辆' : '新增车辆'" width="500px">
      <el-form :model="vehicleForm" :rules="vehicleRules" ref="vehicleFormRef" label-width="100px">
        <el-form-item label="车牌号" prop="plate_number">
          <el-input v-model="vehicleForm.plate_number" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="司机姓名" prop="driver_name">
          <el-input v-model="vehicleForm.driver_name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="driver_phone">
          <el-input v-model="vehicleForm.driver_phone" />
        </el-form-item>
        <el-form-item label="车辆类型">
          <el-select v-model="vehicleForm.vehicle_type" style="width: 100%">
            <el-option label="货车" value="truck" />
            <el-option label="三轮车" value="tricycle" />
            <el-option label="面包车" value="van" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="皮重(kg)">
          <el-input-number v-model="vehicleForm.tare_weight" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVehicle" :loading="submitting">
          确认
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" title="车辆过磅历史" width="900px">
      <div class="vehicle-info" style="margin-bottom: 15px; padding: 10px; background: #f5f7fa; border-radius: 4px;">
        <span>车牌号: <strong>{{ currentVehicle?.plate_number }}</strong></span>
        <span style="margin-left: 20px;">司机: {{ currentVehicle?.driver_name }}</span>
        <span style="margin-left: 20px;">皮重: {{ currentVehicle?.tare_weight }} kg</span>
      </div>
      <el-table :data="vehicleWeighings" border stripe size="small">
        <el-table-column prop="weighing_no" label="磅单号" width="150" />
        <el-table-column prop="material_name" label="物料" width="100" />
        <el-table-column prop="gross_weight" label="毛重(kg)" width="100" />
        <el-table-column prop="tare_weight" label="皮重(kg)" width="100" />
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
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/weighing/detail/${row.id}`)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 15px; text-align: right;">
        <span>总过磅次数: <strong>{{ vehicleWeighings.length }}</strong> 次</span>
        <span style="margin-left: 20px;">总净重: <strong>{{ totalWeighingWeight.toFixed(2) }}</strong> kg</span>
        <span style="margin-left: 20px;">总金额: <strong style="color: #f56c6c;">¥{{ totalWeighingAmount.toFixed(2) }}</strong></span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import db from '@/utils/db'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref([])
const searchKeyword = ref('')
const dialogVisible = ref(false)
const historyVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const vehicleFormRef = ref(null)
const editId = ref(null)
const currentVehicle = ref(null)
const vehicleWeighings = ref([])

const vehicleTypeText = {
  truck: '货车',
  tricycle: '三轮车',
  van: '面包车',
  other: '其他'
}

const statusText = {
  pending: '待结算',
  settled: '已结算',
  cancelled: '已作废'
}

const totalWeighingWeight = computed(() => {
  return vehicleWeighings.value.reduce((sum, w) => sum + Number(w.net_weight), 0)
})

const totalWeighingAmount = computed(() => {
  return vehicleWeighings.value.reduce((sum, w) => sum + Number(w.total_amount), 0)
})

const vehicleForm = reactive({
  plate_number: '',
  driver_name: '',
  driver_phone: '',
  vehicle_type: '',
  tare_weight: 0
})

const vehicleRules = {
  plate_number: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  driver_name: [{ required: true, message: '请输入司机姓名', trigger: 'blur' }]
}

function showAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(vehicleForm, {
    plate_number: '',
    driver_name: '',
    driver_phone: '',
    vehicle_type: '',
    tare_weight: 0
  })
  dialogVisible.value = true
}

function editVehicle(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(vehicleForm, {
    plate_number: row.plate_number,
    driver_name: row.driver_name,
    driver_phone: row.driver_phone,
    vehicle_type: row.vehicle_type,
    tare_weight: row.tare_weight
  })
  dialogVisible.value = true
}

async function submitVehicle() {
  const valid = await vehicleFormRef.value.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await db.query(
        `UPDATE vehicles SET driver_name = ?, driver_phone = ?, vehicle_type = ?, tare_weight = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [vehicleForm.driver_name, vehicleForm.driver_phone, vehicleForm.vehicle_type, vehicleForm.tare_weight, editId.value]
      )
      await db.log('update', 'vehicles', editId.value, null, vehicleForm)
      ElMessage.success('更新成功')
    } else {
      const result = await db.query(
        'INSERT INTO vehicles (plate_number, driver_name, driver_phone, vehicle_type, tare_weight) VALUES (?, ?, ?, ?, ?)',
        [vehicleForm.plate_number, vehicleForm.driver_name, vehicleForm.driver_phone, vehicleForm.vehicle_type, vehicleForm.tare_weight]
      )
      await db.log('create', 'vehicles', result.data.lastInsertRowid, null, vehicleForm)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function deleteVehicle(row) {
  try {
    const countResult = await db.query('SELECT COUNT(*) as count FROM weighings WHERE vehicle_id = ?', [row.id])
    if (countResult.success && countResult.data[0].count > 0) {
      ElMessage.warning('该车辆已有过磅记录，无法删除')
      return
    }
    
    await ElMessageBox.confirm('确定删除此车辆？', '提示', { type: 'warning' })
    await db.query('DELETE FROM vehicles WHERE id = ?', [row.id])
    await db.log('delete', 'vehicles', row.id, row, null)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

async function viewHistory(row) {
  currentVehicle.value = row
  historyVisible.value = true
  
  const result = await db.query(`
    SELECT w.*, m.name as material_name
    FROM weighings w
    LEFT JOIN materials m ON w.material_id = m.id
    WHERE w.vehicle_id = ?
    ORDER BY w.created_at DESC
  `, [row.id])
  
  if (result.success) {
    vehicleWeighings.value = result.data
  }
}

async function loadData() {
  let sql = `
    SELECT v.*,
      (SELECT COUNT(*) FROM weighings w WHERE w.vehicle_id = v.id) as weighing_count,
      (SELECT MAX(created_at) FROM weighings w WHERE w.vehicle_id = v.id) as last_weighing_at
    FROM vehicles v
    WHERE 1=1
  `
  const params = []
  
  if (searchKeyword.value) {
    sql += ' AND (v.plate_number LIKE ? OR v.driver_name LIKE ?)'
    params.push(`%${searchKeyword.value}%`, `%${searchKeyword.value}%`)
  }
  
  sql += ' ORDER BY v.created_at DESC'
  
  const result = await db.query(sql, params)
  if (result.success) {
    tableData.value = result.data.map(v => ({
      ...v,
      vehicle_type_text: vehicleTypeText[v.vehicle_type] || v.vehicle_type
    }))
  }
}

onMounted(() => {
  loadData()
})
</script>
