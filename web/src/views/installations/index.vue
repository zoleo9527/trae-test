<template>
  <div class="page-container">
    <div class="page-header">
      <h2>安装预约</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建预约
      </el-button>
    </div>

    <el-card>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 140px;" @change="loadData">
          <el-option v-for="(item, key) in appointmentStatusMap" :key="key" :label="item.label" :value="key" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px;" @change="loadData" />
      </div>

      <el-table :data="list" stripe>
        <el-table-column label="预约日期" width="120">
          <template #default="{ row }">{{ row.appointmentDate }}</template>
        </el-table-column>
        <el-table-column prop="timeSlot" label="时间段" width="120" />
        <el-table-column label="客户" width="150">
          <template #default="{ row }">{{ row.order?.customer?.name }}</template>
        </el-table-column>
        <el-table-column label="联系电话" width="130">
          <template #default="{ row }">{{ row.order?.customer?.phone }}</template>
        </el-table-column>
        <el-table-column label="安装地址" min-width="200">
          <template #default="{ row }">{{ row.order?.customer?.address }}</template>
        </el-table-column>
        <el-table-column prop="installerName" label="安装师傅" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="goToOrder(row.orderId)">订单详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="success" text @click="confirmAppointment(row.id)">确认</el-button>
            <el-button v-if="row.status === 'confirmed'" size="small" type="warning" text @click="startAppointment(row.id)">开始</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="新建安装预约" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="关联订单">
          <el-select v-model="createForm.orderId" placeholder="请选择订单" style="width: 100%;">
            <el-option
              v-for="order in availableOrders"
              :key="order.id"
              :label="`${order.orderNo} - ${order.customer?.name}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker v-model="createForm.appointmentDate" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="createForm.timeSlot" style="width: 100%;">
            <el-option label="09:00-12:00" value="09:00-12:00" />
            <el-option label="10:00-14:00" value="10:00-14:00" />
            <el-option label="14:00-18:00" value="14:00-18:00" />
            <el-option label="09:00-18:00" value="09:00-18:00" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装师傅">
          <el-input v-model="createForm.installerName" placeholder="请输入安装师傅姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="createForm.installerPhone" placeholder="请输入师傅电话" />
        </el-form-item>
        <el-form-item label="团队人数">
          <el-input-number v-model="createForm.teamSize" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="客户备注">
          <el-input v-model="createForm.customerRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { installationApi, orderApi } from '@/api'
import { appointmentStatusMap } from '@/utils/constants'

const router = useRouter()
const list = ref<any[]>([])
const statusFilter = ref('')
const dateRange = ref<any[]>([])
const showCreateDialog = ref(false)
const availableOrders = ref<any[]>([])

const createForm = ref({
  orderId: null as number | null,
  appointmentDate: '',
  timeSlot: '09:00-12:00',
  installerName: '',
  installerPhone: '',
  teamSize: 2,
  customerRemark: '',
})

function statusType(status: string) { return appointmentStatusMap[status]?.type || 'info' }
function statusLabel(status: string) { return appointmentStatusMap[status]?.label || status }

async function loadData() {
  const params: any = { pageSize: 100 }
  if (statusFilter.value) params.status = statusFilter.value
  if (dateRange.value?.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  const res = await installationApi.getList(params)
  list.value = res.items || []
}

async function loadAvailableOrders() {
  const res = await orderApi.getList({ pageSize: 100, status: 'delivered' })
  availableOrders.value = res.items || []
}

async function handleCreate() {
  if (!createForm.value.orderId) {
    ElMessage.warning('请选择关联订单')
    return
  }
  if (!createForm.value.appointmentDate) {
    ElMessage.warning('请选择预约日期')
    return
  }
  await installationApi.create(createForm.value)
  ElMessage.success('预约创建成功')
  showCreateDialog.value = false
  loadData()
  createForm.value = {
    orderId: null,
    appointmentDate: '',
    timeSlot: '09:00-12:00',
    installerName: '',
    installerPhone: '',
    teamSize: 2,
    customerRemark: '',
  }
}

async function confirmAppointment(id: number) {
  await installationApi.update(id, { status: 'confirmed' })
  ElMessage.success('预约已确认')
  loadData()
}

async function startAppointment(id: number) {
  await installationApi.start(id)
  ElMessage.success('已开始安装')
  loadData()
}

function goToOrder(orderId: number) {
  router.push(`/orders/${orderId}`)
}

onMounted(() => {
  loadData()
  loadAvailableOrders()
})
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
