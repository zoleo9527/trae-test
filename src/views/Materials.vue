<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新增物料
      </el-button>
      <div class="spacer"></div>
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索物料名称" 
        style="width: 200px"
        clearable
        @keyup.enter="loadData"
      />
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-card class="table-container">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="code" label="物料编码" width="120" />
        <el-table-column prop="name" label="物料名称" width="120" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="current_price" label="当前单价" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold">
              ¥{{ row.current_price.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="editPrice(row)">调价</el-button>
            <el-button link type="primary" @click="viewHistory(row)">历史</el-button>
            <el-button link type="danger" @click="toggleActive(row)">
              {{ row.is_active ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增物料" width="500px">
      <el-form :model="materialForm" :rules="materialRules" ref="materialFormRef" label-width="100px">
        <el-form-item label="物料编码" prop="code">
          <el-input v-model="materialForm.code" />
        </el-form-item>
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="materialForm.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="materialForm.category" style="width: 100%">
            <el-option label="黑色金属" value="黑色金属" />
            <el-option label="有色金属" value="有色金属" />
            <el-option label="废纸" value="废纸" />
            <el-option label="塑料" value="塑料" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="materialForm.unit" />
        </el-form-item>
        <el-form-item label="单价" prop="current_price">
          <el-input-number v-model="materialForm.current_price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMaterial" :loading="submitting">
          确认
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="priceDialogVisible" title="调整价格" width="400px">
      <el-descriptions :column="1" border style="margin-bottom: 20px">
        <el-descriptions-item label="物料">{{ currentMaterial?.name }}</el-descriptions-item>
        <el-descriptions-item label="当前价格">¥{{ currentMaterial?.current_price?.toFixed(2) }}</el-descriptions-item>
      </el-descriptions>
      
      <el-form label-width="100px">
        <el-form-item label="新价格">
          <el-input-number v-model="newPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调价原因">
          <el-input v-model="priceReason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="priceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPrice" :loading="submitting">
          确认调价
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="价格历史" width="600px">
      <el-table :data="priceHistory" size="small">
        <el-table-column prop="old_price" label="原价格" width="100">
          <template #default="{ row }">¥{{ row.old_price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="new_price" label="新价格" width="100">
          <template #default="{ row }">¥{{ row.new_price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="changed_by_name" label="操作人" width="100" />
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()

const tableData = ref([])
const searchKeyword = ref('')
const addDialogVisible = ref(false)
const priceDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const submitting = ref(false)
const materialFormRef = ref(null)
const currentMaterial = ref(null)
const newPrice = ref(0)
const priceReason = ref('')
const priceHistory = ref([])

const materialForm = reactive({
  code: '',
  name: '',
  category: '',
  unit: 'kg',
  current_price: 0
})

const materialRules = {
  code: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  current_price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

function showAddDialog() {
  Object.assign(materialForm, {
    code: '',
    name: '',
    category: '',
    unit: 'kg',
    current_price: 0
  })
  addDialogVisible.value = true
}

async function submitMaterial() {
  const valid = await materialFormRef.value.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    const result = await db.query(
      'INSERT INTO materials (code, name, category, unit, current_price) VALUES (?, ?, ?, ?, ?)',
      [materialForm.code, materialForm.name, materialForm.category, materialForm.unit, materialForm.current_price]
    )
    await db.log('create', 'materials', result.data.lastInsertRowid, null, materialForm)
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

function editPrice(row) {
  currentMaterial.value = row
  newPrice.value = row.current_price
  priceReason.value = ''
  priceDialogVisible.value = true
}

async function submitPrice() {
  submitting.value = true
  try {
    const oldPrice = currentMaterial.value.current_price
    
    await db.query(
      'UPDATE materials SET current_price = ? WHERE id = ?',
      [newPrice.value, currentMaterial.value.id]
    )
    
    await db.query(
      'INSERT INTO price_history (material_id, old_price, new_price, changed_by, reason) VALUES (?, ?, ?, ?, ?)',
      [currentMaterial.value.id, oldPrice, newPrice.value, authStore.user.id, priceReason.value]
    )
    
    await db.log('price_change', 'materials', currentMaterial.value.id, 
      { price: oldPrice }, { price: newPrice.value, reason: priceReason.value })
    
    ElMessage.success('调价成功')
    priceDialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function viewHistory(row) {
  const result = await db.query(`
    SELECT ph.*, u.name as changed_by_name
    FROM price_history ph
    LEFT JOIN users u ON ph.changed_by = u.id
    WHERE ph.material_id = ?
    ORDER BY ph.created_at DESC
  `, [row.id])
  
  if (result.success) {
    priceHistory.value = result.data
    historyDialogVisible.value = true
  }
}

async function toggleActive(row) {
  try {
    const action = row.is_active ? '停用' : '启用'
    await ElMessageBox.confirm(`确定${action}此物料？`, '提示', { type: 'warning' })
    
    await db.query(
      'UPDATE materials SET is_active = ? WHERE id = ?',
      [row.is_active ? 0 : 1, row.id]
    )
    await db.log('toggle_active', 'materials', row.id, row, { is_active: !row.is_active })
    
    ElMessage.success(`${action}成功`)
    loadData()
  } catch {}
}

async function loadData() {
  let sql = 'SELECT * FROM materials WHERE 1=1'
  const params = []
  
  if (searchKeyword.value) {
    sql += ' AND (name LIKE ? OR code LIKE ?)'
    params.push(`%${searchKeyword.value}%`, `%${searchKeyword.value}%`)
  }
  
  sql += ' ORDER BY created_at DESC'
  
  const result = await db.query(sql, params)
  if (result.success) {
    tableData.value = result.data
  }
}

onMounted(() => {
  loadData()
})
</script>
