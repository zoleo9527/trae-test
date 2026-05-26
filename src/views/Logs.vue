<template>
  <div>
    <div class="toolbar">
      <el-select v-model="filterTable" placeholder="操作表" style="width: 150px" clearable>
        <el-option label="过磅单" value="weighings" />
        <el-option label="结算单" value="settlements" />
        <el-option label="车辆" value="vehicles" />
        <el-option label="物料" value="materials" />
        <el-option label="用户" value="users" />
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
        <el-table-column prop="user_name" label="操作人" width="100" />
        <el-table-column prop="operation" label="操作" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ operationText[row.operation] || row.operation }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="table_name" label="表名" width="100" />
        <el-table-column prop="record_id" label="记录ID" width="100" />
        <el-table-column prop="old_value" label="原值" min-width="200">
          <template #default="{ row }">
            <span v-if="row.old_value" class="json-preview">{{ row.old_value }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="new_value" label="新值" min-width="200">
          <template #default="{ row }">
            <span v-if="row.new_value" class="json-preview">{{ row.new_value }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/utils/db'

const tableData = ref([])
const filterTable = ref(null)
const dateRange = ref([])

const operationText = {
  create: '创建',
  update: '更新',
  delete: '删除',
  cancel: '作废',
  approve: '通过',
  reject: '驳回',
  paid: '付款',
  resolve: '处理',
  login: '登录',
  price_change: '调价'
}

async function loadData() {
  let sql = `
    SELECT l.*, u.name as user_name
    FROM operation_logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `
  const params = []
  
  if (filterTable.value) {
    sql += ' AND l.table_name = ?'
    params.push(filterTable.value)
  }
  
  if (dateRange.value?.length === 2) {
    sql += ' AND DATE(l.created_at) BETWEEN ? AND ?'
    params.push(dateRange.value[0], dateRange.value[1])
  }
  
  sql += ' ORDER BY l.created_at DESC LIMIT 200'
  
  const result = await db.query(sql, params)
  if (result.success) {
    tableData.value = result.data
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.json-preview {
  font-size: 12px;
  color: #606266;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
