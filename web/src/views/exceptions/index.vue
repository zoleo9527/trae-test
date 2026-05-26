<template>
  <div class="page-container">
    <div class="page-header">
      <h2>异常处理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        登记异常
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="typeFilter" placeholder="异常类型" clearable style="width: 140px;" @change="loadData">
          <el-option v-for="(item, key) in exceptionTypeMap" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="处理状态" clearable style="width: 140px;" @change="loadData">
          <el-option v-for="(item, key) in exceptionStatusMap" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-input v-model="assigneeFilter" placeholder="处理人" clearable style="width: 140px;" @input="loadData" />
      </div>

      <el-table :data="list" stripe>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="typeType(row.type)">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="客户" width="120">
          <template #default="{ row }">{{ row.order?.customer?.name }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="处理人" width="100" />
        <el-table-column label="补件" width="80">
          <template #default="{ row }">{{ row.repairParts?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="goToOrder(row.orderId)">订单</el-button>
            <el-dropdown @command="(cmd) => handleStatusChange(row.id, cmd)">
              <el-button size="small" text>
                变更状态 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="(item, key) in exceptionStatusMap" :key="key" :command="key" :disabled="row.status === key">
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="登记异常" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="关联订单">
          <el-input v-model="form.orderId" type="number" placeholder="请输入订单ID" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="form.type" style="width: 100%;">
            <el-option v-for="(item, key) in exceptionTypeMap" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="form.assignee" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createException">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exceptionApi } from '@/api'
import { exceptionTypeMap, exceptionStatusMap, formatDateTime } from '@/utils/constants'

const router = useRouter()
const list = ref<any[]>([])
const typeFilter = ref('')
const statusFilter = ref('')
const assigneeFilter = ref('')
const showCreateDialog = ref(false)
const form = ref({
  orderId: null as number | null,
  type: 'other',
  title: '',
  description: '',
  assignee: '',
})

function typeType(type: string) { return exceptionTypeMap[type]?.type || 'info' }
function typeLabel(type: string) { return exceptionTypeMap[type]?.label || type }
function statusType(status: string) { return exceptionStatusMap[status]?.type || 'info' }
function statusLabel(status: string) { return exceptionStatusMap[status]?.label || status }

async function loadData() {
  const params: any = { pageSize: 100 }
  if (typeFilter.value) params.type = typeFilter.value
  if (statusFilter.value) params.status = statusFilter.value
  if (assigneeFilter.value) params.assignee = assigneeFilter.value
  const res = await exceptionApi.getList(params)
  list.value = res.items || []
}

async function handleStatusChange(id: number, status: string) {
  await exceptionApi.update(id, { status })
  ElMessage.success('状态已更新')
  loadData()
}

async function createException() {
  if (!form.value.orderId) {
    ElMessage.warning('请输入订单ID')
    return
  }
  await exceptionApi.create(form.value)
  ElMessage.success('异常已登记')
  showCreateDialog.value = false
  loadData()
}

function goToOrder(orderId: number) {
  router.push(`/orders/${orderId}`)
}

onMounted(() => loadData())
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h2 { margin: 0; }
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
