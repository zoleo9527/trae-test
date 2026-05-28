<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2 class="text-xl font-semibold">补领申请详情</h2>
      <el-tag :type="getStatusType(request?.status)" size="large">
        {{ getStatusText(request?.status) }}
      </el-tag>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span class="font-semibold">申请信息</span>
          </template>
          <div class="space-y-4">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="营员">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    :class="request?.camper?.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
                  >
                    {{ request?.camper?.name?.charAt(0) }}
                  </div>
                  <span>{{ request?.camper?.name }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="物资">
                {{ request?.material?.name }}
              </el-descriptions-item>
              <el-descriptions-item label="数量">
                {{ request?.quantity }} {{ request?.material?.unit }}
              </el-descriptions-item>
              <el-descriptions-item label="补领类型">
                {{ getRequestTypeText(request?.requestType) }}
              </el-descriptions-item>
              <el-descriptions-item label="申请人" :span="2">
                {{ request?.requestedBy }}
              </el-descriptions-item>
              <el-descriptions-item label="申请原因" :span="2">
                {{ request?.reason }}
              </el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <div v-if="request?.reviewedBy" class="space-y-2">
              <h4 class="font-medium">审核信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="审核人">
                  {{ request.reviewedBy }}
                </el-descriptions-item>
                <el-descriptions-item label="审核结果">
                  <el-tag :type="request.status === 'rejected' ? 'danger' : 'success'" size="small">
                    {{ request.status === 'rejected' ? '驳回' : '通过' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item v-if="request.rejectReason" label="驳回原因" :span="2">
                  {{ request.rejectReason }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-if="request?.fulfilledBy" class="space-y-2">
              <h4 class="font-medium">发放信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="发放人">
                  {{ request.fulfilledBy }}
                </el-descriptions-item>
                <el-descriptions-item label="发放说明" :span="2">
                  {{ request.fulfillNote || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-if="request?.status === 'closed'" class="space-y-2">
              <h4 class="font-medium">结案信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="回访说明" :span="2">
                  {{ request.followupNote || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="家长通知">
                  <el-tag :type="request.parentNotified ? 'success' : 'info'" size="small">
                    {{ request.parentNotified ? '已通知' : '未通知' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="mt-6">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold flex items-center gap-2">
                <component :is="icons.FileText" class="w-5 h-5" />
                证据链
              </span>
              <el-button size="small" @click="showAddEvidence = true">
                添加备注
              </el-button>
            </div>
          </template>
          <div class="space-y-4">
            <div
              v-for="(item, index) in request?.evidenceChain || []"
              :key="index"
              class="timeline-item pb-6"
            >
              <div class="flex items-start gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <el-tag size="small" :type="getEvidenceTagType(item.actionType)">
                      {{ getActionText(item.actionType) }}
                    </el-tag>
                    <span class="text-sm text-gray-500">
                      {{ item.operator }} ({{ getRoleText(item.operatorRole) }})
                    </span>
                    <span class="text-xs text-gray-400 ml-auto">
                      {{ formatTime(item.createdAt) }}
                    </span>
                  </div>
                  <p class="mt-2 text-gray-700">{{ item.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span class="font-semibold">处理流程</span>
          </template>
          <el-steps direction="vertical" :active="currentStep">
            <el-step title="发起申请" :description="request?.requestedBy" />
            <el-step title="营地主任审核" :description="request?.reviewedBy || '待处理'" />
            <el-step title="后勤发放物资" :description="request?.fulfilledBy || '待处理'" />
            <el-step title="班务老师结案" :description="request?.status === 'closed' ? '已完成' : '待处理'" />
          </el-steps>
        </el-card>

        <el-card shadow="hover" class="mt-6">
          <template #header>
            <span class="font-semibold">快捷操作</span>
          </template>
          <div class="space-y-3">
            <el-button
              v-if="canReview"
              type="success"
              class="w-full"
              @click="showReviewDialog"
            >
              审核申请
            </el-button>
            <el-button
              v-if="canFulfill"
              type="primary"
              class="w-full"
              @click="showFulfillDialog"
            >
              完成发放
            </el-button>
            <el-button
              v-if="canClose"
              type="warning"
              class="w-full"
              @click="showCloseDialog"
            >
              结案回访
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showReview" title="审核申请" width="500px">
      <el-form label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewAction">
            <el-radio value="approve">通过</el-radio>
            <el-radio value="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="reviewAction === 'reject'" label="驳回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="primary" @click="confirmReview">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showFulfill" title="完成发放" width="500px">
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
        <el-button type="primary" @click="confirmFulfill">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showClose" title="结案回访" width="500px">
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
        <el-button type="primary" @click="confirmClose">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddEvidence" title="添加备注" width="500px">
      <el-form label-width="100px">
        <el-form-item label="备注内容">
          <el-input v-model="evidenceContent" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddEvidence = false">取消</el-button>
        <el-button type="primary" @click="addEvidence">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { resupplyApi } from '@/api'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as icons from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()
const request = ref<any>(null)
const showReview = ref(false)
const showFulfill = ref(false)
const showClose = ref(false)
const showAddEvidence = ref(false)
const reviewAction = ref('approve')
const operator = ref('')
const rejectReason = ref('')
const fulfillNote = ref('')
const followupNote = ref('')
const parentNotified = ref(false)
const evidenceContent = ref('')

const currentStep = computed(() => {
  const status = request.value?.status
  if (status === 'closed') return 4
  if (status === 'fulfilled') return 3
  if (status === 'approved' || status === 'rejected') return 2
  if (status === 'pending') return 1
  return 0
})

const canReview = computed(() => {
  return request.value?.status === 'pending' && userStore.user?.role === 'director'
})

const canFulfill = computed(() => {
  return request.value?.status === 'approved' && userStore.user?.role === 'logistics'
})

const canClose = computed(() => {
  return request.value?.status === 'fulfilled' && userStore.user?.role === 'teacher'
})

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

const getEvidenceTagType = (action: string) => {
  if (action.includes('approve') || action === 'fulfill' || action === 'close') return 'success'
  if (action.includes('reject')) return 'danger'
  return 'info'
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = {
    create: '发起申请',
    review_approve: '审核通过',
    review_reject: '审核驳回',
    fulfill: '完成发放',
    close: '结案',
    note: '添加备注',
  }
  return texts[action] || action
}

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    director: '营地主任',
    teacher: '班务老师',
    logistics: '后勤协调',
  }
  return texts[role] || role
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  try {
    request.value = await resupplyApi.getDetail(route.params.id as string)
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const showReviewDialog = () => {
  reviewAction.value = 'approve'
  rejectReason.value = ''
  showReview.value = true
}

const showFulfillDialog = () => {
  fulfillNote.value = ''
  showFulfill.value = true
}

const showCloseDialog = () => {
  followupNote.value = ''
  parentNotified.value = false
  showClose.value = true
}

const confirmReview = async () => {
  try {
    await resupplyApi.review(request.value.id, {
      action: reviewAction.value,
      operator: operator.value,
      reason: reviewAction.value === 'reject' ? rejectReason.value : undefined,
    })
    ElMessage.success('操作成功')
    showReview.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const confirmFulfill = async () => {
  try {
    await resupplyApi.fulfill(request.value.id, {
      operator: operator.value,
      note: fulfillNote.value,
    })
    ElMessage.success('操作成功')
    showFulfill.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const confirmClose = async () => {
  try {
    await resupplyApi.close(request.value.id, {
      operator: operator.value,
      note: followupNote.value,
      parentNotified: parentNotified.value,
    })
    ElMessage.success('操作成功')
    showClose.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const addEvidence = async () => {
  try {
    await resupplyApi.addEvidence(request.value.id, {
      actionType: 'note',
      content: evidenceContent.value,
      operator: operator.value,
      operatorRole: userStore.user?.role,
    })
    ElMessage.success('添加成功')
    showAddEvidence.value = false
    evidenceContent.value = ''
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
