<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2 class="text-xl font-semibold">营员详情</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>基本信息</template>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                :class="camper?.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
              >
                {{ camper?.name?.charAt(0) }}
              </div>
              <div>
                <h3 class="text-xl font-semibold">{{ camper?.name }}</h3>
                <p class="text-gray-500">
                  {{ camper?.gender === 'male' ? '男' : '女' }} · {{ camper?.age }}岁
                </p>
              </div>
            </div>
            <el-divider />
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">身份证号</span>
                <span>{{ camper?.idCard }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">家长姓名</span>
                <span>{{ camper?.parentName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">联系电话</span>
                <span>{{ camper?.parentPhone }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">房间床位</span>
                <span class="text-blue-600">{{ roomInfo }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">过敏史</span>
                <el-tag v-if="camper?.allergy" type="danger" size="small">{{ camper?.allergy }}</el-tag>
                <span v-else class="text-gray-400">无</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">既往病史</span>
                <el-tag v-if="camper?.medicalHistory" type="warning" size="small">{{ camper?.medicalHistory }}</el-tag>
                <span v-else class="text-gray-400">无</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="hover">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="物资领取记录" name="materials">
              <el-table :data="distributions" stripe size="small">
                <el-table-column prop="material.name" label="物资名称" />
                <el-table-column prop="quantity" label="数量" width="80" />
                <el-table-column prop="distributedBy" label="发放人" width="100" />
                <el-table-column prop="createdAt" label="发放时间" width="160">
                  <template #default="{ row }">
                    {{ formatTime(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip />
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="补领申请记录" name="resupply">
              <el-table :data="resupplyRequests" stripe size="small">
                <el-table-column prop="material.name" label="物资名称" />
                <el-table-column prop="requestType" label="类型" width="100">
                  <template #default="{ row }">
                    {{ getRequestTypeText(row.requestType) }}
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" show-overflow-tooltip />
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
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="签到记录" name="checkin">
              <el-table :data="checkIns" stripe size="small">
                <el-table-column prop="activity" label="活动名称" />
                <el-table-column prop="activityDate" label="活动日期" width="120">
                  <template #default="{ row }">
                    {{ formatDate(row.activityDate) }}
                  </template>
                </el-table-column>
                <el-table-column prop="checkedIn" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.checkedIn ? 'success' : 'warning'" size="small">
                      {{ row.checkedIn ? '已签到' : '未签到' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="checkedInBy" label="签到人" width="100" />
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="医疗记录" name="medical">
              <el-table :data="medicalReports" stripe size="small">
                <el-table-column prop="symptom" label="症状" width="120" />
                <el-table-column prop="description" label="详情" show-overflow-tooltip />
                <el-table-column prop="reportType" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.reportType === 'emergency' ? 'danger' : 'warning'" size="small">
                      {{ getReportTypeText(row.reportType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'handled' ? 'success' : 'warning'" size="small">
                      {{ row.status === 'handled' ? '已处理' : '待处理' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="上报时间" width="160">
                  <template #default="{ row }">
                    {{ formatTime(row.createdAt) }}
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { camperApi, materialApi, roomApi } from '@/api'
import { ArrowLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const camper = ref<any>(null)
const rooms = ref<any[]>([])
const activeTab = ref('materials')
const distributions = ref<any[]>([])
const resupplyRequests = ref<any[]>([])
const checkIns = ref<any[]>([])
const medicalReports = ref<any[]>([])

const roomInfo = computed(() => {
  if (!camper.value?.roomId) return '未分配'
  const room = rooms.value.find((r) => r.id === camper.value.roomId)
  if (!room) return '未知'
  return `${room.building}${room.name} ${camper.value.bedNumber}号床`
})

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
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

const getReportTypeText = (type: string) => {
  const texts: Record<string, string> = {
    allergy: '过敏',
    chronic: '慢性病',
    injury: '外伤',
    emergency: '紧急',
    other: '其他',
  }
  return texts[type] || type
}

const loadData = async () => {
  try {
    const id = route.params.id as string
    camper.value = await camperApi.getDetail(id)
    rooms.value = await roomApi.getList()
    distributions.value = await materialApi.getDistributions(id)
    resupplyRequests.value = camper.value.resupplyRequests || []
    checkIns.value = camper.value.checkIns || []
    medicalReports.value = camper.value.medicalReports || []
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

onMounted(() => {
  loadData()
})
</script>
