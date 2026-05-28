<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <el-tabs v-model="activeTab" class="flex-1">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="已通过" name="approved" />
        <el-tab-pane label="已发放" name="fulfilled" />
        <el-tab-pane label="已完成" name="closed" />
        <el-tab-pane label="已驳回" name="rejected" />
      </el-tabs>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        发起补领
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="filteredRequests" stripe>
        <el-table-column label="营员" width="120">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                :class="row.camper?.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
              >
                {{ row.camper?.name?.charAt(0) }}
              </div>
              <span>{{ row.camper?.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="material.name" label="物资" width="120" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="requestType" label="类型" width="100">
          <template #default="{ row }">
            {{ getRequestTypeText(row.requestType) }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="requestedBy" label="申请人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="当前处理" width="120">
          <template #default="{ row }">
            <span v-if="row.currentHandler" class="text-blue-600">
              {{ getHandlerText(row.currentHandler) }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="canReview(row)"
              link
              type="success"
              @click="showReviewDialog(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="canFulfill(row)"
              link
              type="primary"
              @click="showFulfillDialog(row)"
            >
              发放
            </el-button>
            <el-button
              v-if="canClose(row)"
              link
              type="warning"
              @click="showCloseDialog(row)"
            >
              结案
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="发起补领申请" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="营员">
          <el-select v-model="createForm.camperId" placeholder="选择营员" style="width: 100%">
            <el-option
              v-for="camper in campers"
              :key="camper.id"
              :label="camper.name"
              :value="camper.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物资">
          <el-select v-model="createForm.materialId" placeholder="选择物资" style="width: 100%">
            <el-option
              v-for="material in materials"
              :key="material.id"
              :label="material.name"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="createForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="补领类型">
          <el-select v-model="createForm.requestType" placeholder="选择类型" style="width: 100%">
            <el-option label="遗失" value="lost" />
            <el-option label="损坏" value="damaged" />
            <el-option label="不足" value="insufficient" />
            <el-option label="尺码问题" value="size_issue" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请原因">
          <el-input v-model="createForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="createForm.requestedBy" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRequest">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReview" title="审核补领申请" width="500px">
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p><strong>营员：</strong>{{ selectedRequest?.camper?.name }}</p>
          <p><strong>物资：</strong>{{ selectedRequest?.material?.name }}</p>
          <p><strong>数量：</strong>{{ selectedRequest?.quantity }}</p>
          <p><strong>原因：</strong>{{ selectedRequest?.reason }}</p>
        </div>
        <el-form label-width="100px">
          <el-form-item label="驳回原因" v-if="reviewAction === 'reject'">
            <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="operator" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="success" @click="confirmReview('approve')">通过</el-button>
        <el-button type="danger" @click="reviewAction = 'reject'">驳回</el-button>
        <el-button v-if="reviewAction === 'reject'" type="danger" @click="confirmReview('reject')">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showFulfill" title="完成物资发放" width="500px">
      <el-form label-width="100px">
        <el-form-item label="发放说明">
          <el-input v-model="fulfillNote" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFulfill = false">取消</el-button>
        <el-button type="primary" @click="confirmFulfill">确认发放</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showClose" title="结案并回访" width="500px">
      <el-form label-width="100px">
        <el-form-item label="回访说明">
          <el-input v-model="followupNote" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="家长回访">
          <el-switch v-model="parentNotified" active-text="已通知" inactive-text="未通知" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showClose = false">取消</el-button>
        <el-button type="primary" @click="confirmClose">确认结案</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { resupplyApi, camperApi, materialApi } from '@/api'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const requests = ref<any[]>([])
const campers = ref<any[]>([])
const materials = ref<any[]>([])
const activeTab = ref('all')
const showCreateDialog = ref(false)
const showReview = ref(false)
const showFulfill = ref(false)
const showClose = ref(false)
const selectedRequest = ref<any>(null)
const reviewAction = ref('')
const operator = ref('')
const rejectReason = ref('')
const fulfillNote = ref('')
const followupNote = ref('')
const parentNotified = ref(false)

const createForm = ref<any>({
  camperId: '',
  materialId: '',
  quantity: 1,
  requestType: '',
  reason: '',
  requestedBy: '',
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return requests.value
  return requests.value.filter((r) => r.status === activeTab.value)
})

const getRequestTypeText = (type: string) => {
  const texts: Record<string, string> = {
    lost: '遗失',
    damaged: '损坏',
    insufficient: '不足',
    size_issue: '尺码问题',
    other: '其他',
  }
  return texts[type] || type
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'primary',
    fulfilled: 'success',
    closed: 'info',
    rejected: 'danger',
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    fulfilled: '已发放',
    closed: '已完成',
    rejected: '已驳回',
  }
  return texts[status] || status
}

const getHandlerText = (handler: string) => {
  const texts: Record<string, string> = {
    director: '营地主任',
    logistics: '后勤协调',
    teacher: '班务老师',
  }
  return texts[handler] || handler
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const canReview = (row: any) => {
  return row.status === 'pending' && userStore.user?.role === 'director'
}

const canFulfill = (row: any) => {
  return row.status === 'approved' && userStore.user?.role === 'logistics'
}

const canClose = (row: any) => {
  return row.status === 'fulfilled' && userStore.user?.role === 'teacher'
}

const loadData = async () => {
  try {
    requests.value = await resupplyApi.getList()
    campers.value = await camperApi.getList()
    materials.value = await materialApi.getList()
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const viewDetail = (row: any) => {
  router.push(`/resupply/${row.id}`)
}

const showReviewDialog = (row: any) => {
  selectedRequest.value = row
  reviewAction.value = ''
  rejectReason.value = ''
  showReview.value = true
}

const showFulfillDialog = (row: any) => {
  selectedRequest.value = row
  fulfillNote.value = ''
  showFulfill.value = true
}

const showCloseDialog = (row: any) => {
  selectedRequest.value = row
  followupNote.value = ''
  parentNotified.value = false
  showClose.value = true
}

const submitRequest = async () => {
  try {
    await resupplyApi.create(createForm.value)
    ElMessage.success('申请已提交')
    showCreateDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error('提交失败')
  }
}

const confirmReview = async (action: string) => {
  try {
    await resupplyApi.review(selectedRequest.value.id, {
      action,
      operator: operator.value,
      reason: action === 'reject' ? rejectReason.value : undefined,
    })
    ElMessage.success(action === 'approve' ? '审核通过' : '已驳回')
    showReview.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const confirmFulfill = async () => {
  try {
    await resupplyApi.fulfill(selectedRequest.value.id, {
      operator: operator.value,
      note: fulfillNote.value,
    })
    ElMessage.success('发放完成')
    showFulfill.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const confirmClose = async () => {
  try {
    await resupplyApi.close(selectedRequest.value.id, {
      operator: operator.value,
      note: followupNote.value,
      parentNotified: parentNotified.value,
    })
    ElMessage.success('已结案')
    showClose.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
