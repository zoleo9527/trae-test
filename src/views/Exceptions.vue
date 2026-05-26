<template>
  <div>
    <div class="toolbar">
      <el-select v-model="filterType" placeholder="异常类型" style="width: 150px" clearable>
        <el-option label="价格异常" value="price_deviation" />
        <el-option label="扣款记录" value="deduction" />
        <el-option label="重量异常" value="weight_anomaly" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select v-model="filterResolved" placeholder="处理状态" style="width: 120px">
        <el-option label="全部" :value="null" />
        <el-option label="未处理" :value="0" />
        <el-option label="已处理" :value="1" />
      </el-select>
      <div class="spacer"></div>
      <el-button @click="loadData">刷新</el-button>
    </div>

    <el-card class="table-container">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.severity === 'warning' ? 'warning' : 'danger'" size="small">
              {{ typeText[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="异常描述" min-width="250" />
        <el-table-column prop="related_id" label="关联ID" width="100" />
        <el-table-column prop="severity" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.severity === 'warning' ? 'warning' : 'danger'" size="small">
              {{ row.severity === 'warning' ? '警告' : '严重' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resolved" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.resolved ? 'success' : 'info'" size="small">
              {{ row.resolved ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column prop="resolved_at" label="处理时间" width="160" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              v-if="!row.resolved" 
              link type="primary" 
              @click="resolveException(row)"
            >
              标记处理
            </el-button>
            <el-button link type="primary" @click="viewRelated(row)">
              查看关联
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const tableData = ref([])
const filterType = ref(null)
const filterResolved = ref(0)

const typeText = {
  price_deviation: '价格异常',
  deduction: '扣款记录',
  weight_anomaly: '重量异常',
  other: '其他'
}

async function loadData() {
  let sql = 'SELECT * FROM exceptions WHERE 1=1'
  const params = []
  
  if (filterType.value) {
    sql += ' AND type = ?'
    params.push(filterType.value)
  }
  
  if (filterResolved.value !== null) {
    sql += ' AND resolved = ?'
    params.push(filterResolved.value)
  }
  
  sql += ' ORDER BY created_at DESC'
  
  const result = await db.query(sql, params)
  if (result.success) {
    tableData.value = result.data
  }
}

async function resolveException(row) {
  await db.query(
    'UPDATE exceptions SET resolved = 1, resolved_by = ?, resolved_at = ? WHERE id = ?',
    [authStore.user.id, dayjs().format('YYYY-MM-DD HH:mm:ss'), row.id]
  )
  await db.log('resolve', 'exceptions', row.id, row, { resolved: 1 })
  
  ElMessage.success('已标记处理')
  loadData()
}

function viewRelated(row) {
  if (row.type === 'price_deviation' || row.type === 'weight_anomaly') {
    router.push(`/weighing/detail/${row.related_id}`)
  } else if (row.type === 'deduction') {
    router.push(`/settlement/detail/${row.related_id}`)
  }
}

onMounted(() => {
  loadData()
})
</script>
