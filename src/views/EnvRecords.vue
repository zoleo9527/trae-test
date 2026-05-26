<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新增台账
      </el-button>
      <el-select v-model="filterType" placeholder="记录类型" style="width: 150px" clearable>
        <el-option label="进货记录" value="purchase" />
        <el-option label="出库记录" value="sale" />
        <el-option label="环保检查" value="env_check" />
        <el-option label="其他" value="other" />
      </el-select>
      <div class="spacer"></div>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px"
      />
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-card class="table-container">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="record_date" label="日期" width="120" />
        <el-table-column prop="record_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ typeText[row.record_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="300" />
        <el-table-column prop="recorder_name" label="记录人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="editRecord(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑台账' : '新增台账'" width="600px">
      <el-form :model="recordForm" :rules="recordRules" ref="recordFormRef" label-width="100px">
        <el-form-item label="记录日期" prop="record_date">
          <el-date-picker 
            v-model="recordForm.record_date" 
            type="date" 
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="记录类型" prop="record_type">
          <el-select v-model="recordForm.record_type" style="width: 100%">
            <el-option label="进货记录" value="purchase" />
            <el-option label="出库记录" value="sale" />
            <el-option label="环保检查" value="env_check" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="recordForm.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="recordForm.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecord" :loading="submitting">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const tableData = ref([])
const filterType = ref(null)
const dateRange = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const recordFormRef = ref(null)
const editId = ref(null)

const typeText = {
  purchase: '进货记录',
  sale: '出库记录',
  env_check: '环保检查',
  other: '其他'
}

const recordForm = reactive({
  record_date: dayjs().format('YYYY-MM-DD'),
  record_type: 'other',
  content: '',
  status: 'draft'
})

const recordRules = {
  record_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  record_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

function showAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(recordForm, {
    record_date: dayjs().format('YYYY-MM-DD'),
    record_type: 'other',
    content: '',
    status: 'draft'
  })
  dialogVisible.value = true
}

function editRecord(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(recordForm, row)
  dialogVisible.value = true
}

async function submitRecord() {
  const valid = await recordFormRef.value.validate()
  if (!valid) return
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await db.query(
        `UPDATE env_records SET record_date = ?, record_type = ?, content = ?, status = ? WHERE id = ?`,
        [recordForm.record_date, recordForm.record_type, recordForm.content, recordForm.status, editId.value]
      )
      await db.log('update', 'env_records', editId.value, null, recordForm)
      ElMessage.success('更新成功')
    } else {
      const result = await db.query(
        'INSERT INTO env_records (record_date, record_type, content, recorder_id, status) VALUES (?, ?, ?, ?, ?)',
        [recordForm.record_date, recordForm.record_type, recordForm.content, authStore.user.id, recordForm.status]
      )
      await db.log('create', 'env_records', result.data.lastInsertRowid, null, recordForm)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function deleteRecord(row) {
  try {
    await ElMessageBox.confirm('确定删除此台账记录？', '提示', { type: 'warning' })
    await db.query('DELETE FROM env_records WHERE id = ?', [row.id])
    await db.log('delete', 'env_records', row.id, row, null)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

async function loadData() {
  let sql = `
    SELECT e.*, u.name as recorder_name
    FROM env_records e
    LEFT JOIN users u ON e.recorder_id = u.id
    WHERE 1=1
  `
  const params = []
  
  if (filterType.value) {
    sql += ' AND e.record_type = ?'
    params.push(filterType.value)
  }
  
  if (dateRange.value?.length === 2) {
    sql += ' AND e.record_date BETWEEN ? AND ?'
    params.push(dateRange.value[0], dateRange.value[1])
  }
  
  sql += ' ORDER BY e.record_date DESC, e.created_at DESC'
  
  const result = await db.query(sql, params)
  if (result.success) {
    tableData.value = result.data
  }
}

onMounted(() => {
  loadData()
})
</script>
