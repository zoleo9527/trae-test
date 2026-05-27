<template>
  <div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title">异常处理中心</div>
        <div class="list-filters">
          <select v-model="statusFilter" class="input" style="width: 140px;">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="resolved">已解决</option>
          </select>
          <select v-model="typeFilter" class="input" style="width: 140px;">
            <option value="">全部类型</option>
            <option v-for="(label, value) in EXCEPTION_TYPES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="two-column">
      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">异常列表</div>
          <span style="font-size: 13px; color: var(--gray-500);">
            共 {{ filteredExceptions.length }} 条
          </span>
        </div>
        <div class="list-items">
          <div
            v-for="exc in filteredExceptions"
            :key="exc.id"
            class="list-item"
            :class="{ selected: selectedException?.id === exc.id }"
            @click="selectException(exc)"
          >
            <div class="list-item-title">
              <span>{{ exc.title }}</span>
              <span
                :class="['badge', exc.status === 'pending' ? 'badge-danger' : 'badge-success']"
              >
                {{ exc.status === 'pending' ? '待处理' : '已解决' }}
              </span>
            </div>
            <div class="list-item-subtitle">
              {{ EXCEPTION_TYPES[exc.type] || exc.type }} · 订单：{{ exc.order_id }}
            </div>
            <div class="list-item-subtitle" style="color: var(--gray-600);">
              {{ exc.description }}
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">👤 {{ exc.reported_by }}</span>
              <span class="list-item-meta-item">🕐 {{ formatTime(exc.reported_at) }}</span>
            </div>
          </div>
          <div v-if="filteredExceptions.length === 0" class="empty-state">
            <div class="empty-state-icon">✨</div>
            <div class="empty-state-text">暂无异常记录</div>
          </div>
        </div>
      </div>

      <div class="detail-panel">
        <div v-if="selectedException" class="detail-header">
          <div class="detail-title">{{ selectedException.title }}</div>
          <div class="detail-subtitle">
            {{ EXCEPTION_TYPES[selectedException.type] || selectedException.type }} · 
            {{ selectedException.status === 'pending' ? '待处理' : '已解决' }}
          </div>
        </div>
        <div v-else class="detail-header">
          <div class="detail-title">请选择异常记录</div>
          <div class="detail-subtitle">从左侧列表选择查看详情</div>
        </div>

        <div class="detail-body">
          <div v-if="selectedException && orderDetail">
            <div class="detail-section">
              <div class="detail-section-title">异常信息</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item-label">异常类型</div>
                  <div class="detail-item-value">
                    {{ EXCEPTION_TYPES[selectedException.type] || selectedException.type }}
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">上报人</div>
                  <div class="detail-item-value">{{ selectedException.reported_by }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">上报时间</div>
                  <div class="detail-item-value">{{ formatTime(selectedException.reported_at) }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">关联路线</div>
                  <div class="detail-item-value">
                    <NuxtLink
                      :to="`/routes/${selectedException.route_id}`"
                      style="color: var(--primary); text-decoration: underline;"
                    >
                      {{ selectedException.route_id }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
              <div style="margin-top: 12px;">
                <div class="detail-item-label">问题描述</div>
                <div style="padding: 12px; background-color: var(--gray-50); border-radius: 6px; font-size: 14px;">
                  {{ selectedException.description }}
                </div>
              </div>
              <div v-if="selectedException.photos.length > 0" style="margin-top: 12px;">
                <div class="detail-item-label" style="margin-bottom: 8px;">现场照片</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <img
                    v-for="(photo, index) in selectedException.photos"
                    :key="index"
                    :src="photo"
                    alt="现场照片"
                    style="width: 100px; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid var(--gray-200); cursor: pointer;"
                  />
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">关联订单</div>
              <div class="detail-grid">
                <div class="detail-item" style="grid-column: span 2;">
                  <div class="detail-item-label">客户</div>
                  <div class="detail-item-value">{{ orderDetail.customer_name }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">水产品种</div>
                  <div class="detail-item-value">{{ orderDetail.water_type }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">订购数量</div>
                  <div class="detail-item-value">{{ orderDetail.quantity }} 桶</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">订单状态</div>
                  <div class="detail-item-value">
                    <span :class="['badge', `badge-${getOrderStatusColor(orderDetail)}`]">
                      {{ getOrderStatusLabel(orderDetail) }}
                    </span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">实送数量</div>
                  <div class="detail-item-value">{{ orderDetail.delivered_quantity }} 桶</div>
                </div>
              </div>
            </div>

            <div v-if="selectedException.status === 'resolved'" class="detail-section">
              <div class="detail-section-title">处理结果</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item-label">处理人</div>
                  <div class="detail-item-value">{{ selectedException.handled_by }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">处理时间</div>
                  <div class="detail-item-value">{{ formatTime(selectedException.handled_at || '') }}</div>
                </div>
              </div>
              <div style="margin-top: 12px;">
                <div class="detail-item-label">订单状态</div>
                <div style="margin-top: 4px;">
                  <template v-if="orderDetail?.is_rescheduled">
                    <span class="badge badge-info">📅 已改约 - 从本路线移除</span>
                  </template>
                  <template v-else-if="orderDetail?.status === 'pending'">
                    <span class="badge badge-warning">📦 待补送 - 已恢复到路线中</span>
                  </template>
                  <template v-else-if="orderDetail?.status === 'delivered'">
                    <span class="badge badge-success">✅ 已完成 - 标记为已签收</span>
                  </template>
                </div>
              </div>
              <div style="margin-top: 12px;">
                <div class="detail-item-label">解决方案</div>
                <div style="padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 6px; font-size: 14px;">
                  {{ selectedException.resolution }}
                </div>
              </div>
            </div>

            <div v-if="selectedException.status === 'pending'" class="detail-section">
              <div class="detail-section-title">处理异常</div>
              <div class="form-group">
                <label class="input-label">处理方式</label>
                <select v-model="handleType" class="input">
                  <option v-for="ht in HANDLE_TYPES" :key="ht.value" :value="ht.value">
                    {{ ht.label }}
                  </option>
                </select>
                <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">
                  <template v-if="handleType === 're_deliver'">
                    📦 订单将恢复为「待配送」，可继续在本路线中签收
                  </template>
                  <template v-else-if="handleType === 'reschedule'">
                    📅 订单将标记为「已改约」，从本路线移除，后续重新安排
                  </template>
                  <template v-else>
                    ✅ 订单将直接标记为「已签收」，无需补送
                  </template>
                </div>
              </div>
              <div class="form-group">
                <label class="input-label">解决方案说明</label>
                <textarea
                  v-model="resolution"
                  class="input"
                  rows="3"
                  placeholder="请详细描述处理方案..."
                ></textarea>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="height: 100%;">
            <div class="empty-state-icon">👈</div>
            <div class="empty-state-text">选择左侧异常记录查看详情</div>
          </div>
        </div>

        <div v-if="selectedException && selectedException.status === 'pending'" class="detail-actions">
          <button
            class="btn btn-success"
            @click="handleException"
            :disabled="!resolution.trim()"
          >
            ✅ 确认处理
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExceptionReport, Order } from '~/types'
import { EXCEPTION_TYPES, STATUS_LABELS, STATUS_COLORS, HANDLE_TYPES } from '~/types'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()
const { user } = useAuth()

const exceptions = ref<ExceptionReport[]>([])
const selectedException = ref<ExceptionReport | null>(null)
const orderDetail = ref<Order | null>(null)
const statusFilter = ref('')
const typeFilter = ref('')
const resolution = ref('')
const handleType = ref('re_deliver')

const getOrderStatusLabel = (order: Order) => {
  if (order.is_rescheduled) return STATUS_LABELS.rescheduled
  return STATUS_LABELS[order.status] || order.status
}

const getOrderStatusColor = (order: Order) => {
  if (order.is_rescheduled) return 'info'
  return STATUS_COLORS[order.status] || 'warning'
}

const filteredExceptions = computed(() => {
  let result = [...exceptions.value]
  if (statusFilter.value) {
    result = result.filter(e => e.status === statusFilter.value)
  }
  if (typeFilter.value) {
    result = result.filter(e => e.type === typeFilter.value)
  }
  result.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1
    }
    return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
  })
  return result
})

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timeStr
  }
}

const selectException = async (exc: ExceptionReport) => {
  selectedException.value = exc
  resolution.value = exc.resolution || ''
  handleType.value = 're_deliver'
  try {
    orderDetail.value = await $fetch<Order>(`${config.public.apiBase}/orders/${exc.order_id}`)
  } catch (error) {
    console.error('加载订单详情失败:', error)
  }
}

const loadExceptions = async () => {
  try {
    exceptions.value = await $fetch<ExceptionReport[]>(`${config.public.apiBase}/exceptions`)
  } catch (error) {
    console.error('加载异常列表失败:', error)
  }
}

const handleException = async () => {
  if (!selectedException.value) return

  try {
    await $fetch(`${config.public.apiBase}/exceptions/${selectedException.value.id}/handle`, {
      method: 'POST',
      body: {
        resolution: resolution.value,
        handled_by: user.value?.name || '系统',
        handle_type: handleType.value
      }
    })
    await loadExceptions()
    const updated = exceptions.value.find(e => e.id === selectedException.value!.id)
    if (updated) {
      selectedException.value = updated
      orderDetail.value = await $fetch<Order>(`${config.public.apiBase}/orders/${updated.order_id}`)
    }
  } catch (error) {
    console.error('处理异常失败:', error)
    alert('处理失败，请重试')
  }
}

onMounted(() => {
  loadExceptions()
})
</script>
