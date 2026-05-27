<template>
  <div>
    <button class="btn btn-outline btn-sm" style="margin-bottom: 16px;" @click="navigateTo('/routes')">
      ← 返回路线列表
    </button>

    <div v-if="routeData" class="card" style="margin-bottom: 24px;">
      <div class="card-body">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">{{ routeData.name }}</h2>
            <p style="color: var(--gray-500); font-size: 14px;">
              司机：{{ routeData.driver_name }} · 车辆：{{ routeData.vehicle_no }} · 
              <span :class="['badge', `badge-${STATUS_COLORS[routeData.status]}`]">
                {{ STATUS_LABELS[routeData.status] }}
              </span>
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button
              v-if="routeData.status === 'pending'"
              class="btn btn-success"
              @click="startRoute"
            >
              🚀 开始配送
            </button>
            <button
              v-if="routeData.status === 'in_progress' && routeData.pending_orders === 0"
              class="btn btn-success"
              @click="completeRoute"
            >
              ✅ 完成路线
            </button>
          </div>
        </div>
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          <div>
            <div style="font-size: 12px; color: var(--gray-500);">总订单</div>
            <div style="font-size: 24px; font-weight: 700;">{{ routeData.total_orders }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--gray-500);">已完成</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--success);">{{ routeData.delivered_orders }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--gray-500);">待配送</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--warning);">{{ routeData.pending_orders }}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: var(--gray-500);">异常</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--danger);">{{ routeData.exception_orders }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="two-column">
      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">订单列表</div>
          <div class="list-filters">
            <select v-model="orderStatusFilter" class="input" style="width: 120px;">
              <option value="">全部</option>
              <option value="pending">待配送</option>
              <option value="delivered">已签收</option>
              <option value="exception">异常</option>
              <option value="rescheduled">已改约</option>
            </select>
          </div>
        </div>
        <div class="list-items">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="list-item"
            :class="{ selected: selectedOrder?.id === order.id }"
            @click="selectOrder(order)"
          >
            <div class="list-item-title">
              <span>{{ order.customer_name }}</span>
              <span :class="['badge', `badge-${getOrderStatusColor(order)}`]">
                {{ getOrderStatusLabel(order) }}
              </span>
            </div>
            <div class="list-item-subtitle">
              {{ order.water_type }} · {{ order.quantity }} 桶
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">💰 ¥{{ order.total_amount }}</span>
              <span class="list-item-meta-item">📍 {{ order.delivery_sequence }} 号</span>
            </div>
            <div v-if="order.note" class="list-item-subtitle" style="color: var(--primary); margin-top: 4px;">
              📝 {{ order.note }}
            </div>
          </div>
          <div v-if="filteredOrders.length === 0" class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">暂无符合条件的订单</div>
          </div>
        </div>
      </div>

      <div class="detail-panel">
        <div v-if="selectedOrder" class="detail-header">
          <div class="detail-title">{{ selectedOrder.customer_name }}</div>
          <div class="detail-subtitle">
            订单号：{{ selectedOrder.id }} · {{ getOrderStatusLabel(selectedOrder) }}
          </div>
        </div>
        <div v-else class="detail-header">
          <div class="detail-title">请选择订单</div>
          <div class="detail-subtitle">从左侧选择订单进行签收或异常处理</div>
        </div>

        <div class="detail-body">
          <div v-if="selectedOrder">
            <div class="detail-section">
              <div class="detail-section-title">订单信息</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item-label">水产品种</div>
                  <div class="detail-item-value">{{ selectedOrder.water_type }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">订购数量</div>
                  <div class="detail-item-value">{{ selectedOrder.quantity }} 桶</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">单价</div>
                  <div class="detail-item-value">¥{{ selectedOrder.price_per_bucket }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">订单金额</div>
                  <div class="detail-item-value" style="color: var(--primary); font-weight: 600;">
                    ¥{{ selectedOrder.total_amount }}
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">客户信息</div>
              <div class="detail-grid">
                <div class="detail-item" style="grid-column: span 2;">
                  <div class="detail-item-label">地址</div>
                  <div class="detail-item-value">{{ customer?.address || '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">联系人</div>
                  <div class="detail-item-value">{{ customer?.contact || '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">电话</div>
                  <div class="detail-item-value">{{ customer?.phone || '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">押桶数</div>
                  <div class="detail-item-value">{{ customer?.deposit_buckets || 0 }} 个</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">欠桶数</div>
                  <div class="detail-item-value" :style="{ color: customer && customer.outstanding_buckets > 0 ? 'var(--warning)' : 'var(--success)' }">
                    {{ customer?.outstanding_buckets || 0 }} 个
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.status === 'delivered'" class="detail-section">
              <div class="detail-section-title">签收信息</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item-label">签收人</div>
                  <div class="detail-item-value">{{ selectedOrder.recipient_signature || '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">签收时间</div>
                  <div class="detail-item-value">{{ selectedOrder.actual_delivered_at ? formatTime(selectedOrder.actual_delivered_at) : '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">实送桶数</div>
                  <div class="detail-item-value">{{ selectedOrder.delivered_quantity }} 桶</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">回收空桶</div>
                  <div class="detail-item-value">{{ selectedOrder.returned_empty_buckets }} 个</div>
                </div>
              </div>
              <div v-if="selectedOrder.signed_photo_url" style="margin-top: 12px;">
                <div class="detail-item-label" style="margin-bottom: 8px;">签收照片</div>
                <img
                  :src="selectedOrder.signed_photo_url"
                  alt="签收照片"
                  style="max-width: 200px; border-radius: 8px; border: 1px solid var(--gray-200);"
                />
              </div>
            </div>

            <div v-if="orderExceptions.length > 0" class="detail-section">
              <div class="detail-section-title">异常记录</div>
              <div class="timeline">
                <div
                  v-for="exc in orderExceptions"
                  :key="exc.id"
                  class="timeline-item"
                >
                  <div class="timeline-dot" :class="exc.status === 'resolved' ? 'success' : 'danger'"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">
                      {{ EXCEPTION_TYPES[exc.type] || exc.type }} · {{ exc.title }}
                    </div>
                    <div class="timeline-time">
                      {{ formatTime(exc.reported_at) }} · {{ exc.reported_by }}
                    </div>
                    <div class="timeline-description">{{ exc.description }}</div>
                    <div v-if="exc.status === 'resolved'" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--gray-200);">
                      <div style="font-size: 12px; color: var(--success); font-weight: 500;">
                        ✅ 已处理：{{ exc.handled_by }} · {{ formatTime(exc.handled_at || '') }}
                      </div>
                      <div style="font-size: 13px; color: var(--gray-600); margin-top: 4px;">
                        {{ exc.resolution }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.status === 'pending'" class="detail-section">
              <div class="detail-section-title">订单签收</div>
              <div class="form-row">
                <div class="form-group">
                  <label class="input-label">实送桶数</label>
                  <input
                    v-model.number="signForm.delivered_quantity"
                    type="number"
                    class="input"
                    min="0"
                    :max="selectedOrder.quantity"
                  />
                </div>
                <div class="form-group">
                  <label class="input-label">回收空桶</label>
                  <input
                    v-model.number="signForm.returned_empty_buckets"
                    type="number"
                    class="input"
                    min="0"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="input-label">签收人姓名</label>
                <input
                  v-model="signForm.recipient_signature"
                  type="text"
                  class="input"
                  placeholder="请输入签收人姓名"
                />
              </div>
              <div class="form-group">
                <label class="input-label">备注</label>
                <textarea
                  v-model="signForm.note"
                  class="input"
                  rows="2"
                  placeholder="选填"
                ></textarea>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="height: 100%;">
            <div class="empty-state-icon">👈</div>
            <div class="empty-state-text">选择左侧订单查看详情</div>
          </div>
        </div>

        <div v-if="selectedOrder && routeData?.status === 'in_progress'" class="detail-actions">
          <template v-if="selectedOrder.status === 'pending'">
            <button class="btn btn-warning" @click="showExceptionModal = true">
              ⚠️ 上报异常
            </button>
            <button
              class="btn btn-success"
              @click="submitDelivery"
              :disabled="!canSign"
            >
              ✅ 确认签收
            </button>
          </template>
          <template v-else-if="selectedOrder.status === 'exception' && !selectedOrder.is_rescheduled">
            <div style="color: var(--warning); font-size: 13px; text-align: left; flex: 1;">
              ⚠️ 该订单存在未处理异常，请先在「异常处理中心」处理
            </div>
          </template>
          <template v-else-if="selectedOrder.is_rescheduled">
            <div style="color: var(--info); font-size: 13px; text-align: left; flex: 1;">
              📅 该订单已改约，已从本路线移除
            </div>
          </template>
          <template v-else-if="selectedOrder.status === 'delivered'">
            <div style="color: var(--success); font-size: 13px; text-align: left; flex: 1;">
              ✅ 该订单已完成签收
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="showExceptionModal" class="modal-overlay" @click.self="showExceptionModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">上报异常</div>
          <button class="modal-close" @click="showExceptionModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="input-label">异常类型</label>
            <select v-model="exceptionForm.type" class="input">
              <option v-for="(label, value) in EXCEPTION_TYPES" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="input-label">异常标题</label>
            <input
              v-model="exceptionForm.title"
              type="text"
              class="input"
              placeholder="简要描述异常"
            />
          </div>
          <div class="form-group">
            <label class="input-label">详细说明</label>
            <textarea
              v-model="exceptionForm.description"
              class="input"
              rows="4"
              placeholder="请详细描述异常情况..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showExceptionModal = false">取消</button>
          <button class="btn btn-danger" @click="submitException" :disabled="!exceptionForm.type || !exceptionForm.description">
            提交异常
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Route, Order, Customer, ExceptionReport } from '~/types'
import { STATUS_LABELS, STATUS_COLORS, EXCEPTION_TYPES } from '~/types'

definePageMeta({
  layout: 'default'
})

const currentRoute = useRoute()
const config = useRuntimeConfig()

const routeId = computed(() => currentRoute.params.id as string)
const routeData = ref<Route | null>(null)
const orders = ref<Order[]>([])
const selectedOrder = ref<Order | null>(null)
const customer = ref<Customer | null>(null)
const orderExceptions = ref<ExceptionReport[]>([])
const orderStatusFilter = ref('')
const showExceptionModal = ref(false)
const { user } = useAuth()

const signForm = ref({
  delivered_quantity: 0,
  returned_empty_buckets: 0,
  recipient_signature: '',
  note: ''
})

const exceptionForm = ref({
  type: 'shortage',
  title: '',
  description: ''
})

const getOrderStatusLabel = (order: Order) => {
  if (order.is_rescheduled) return STATUS_LABELS.rescheduled
  return STATUS_LABELS[order.status] || order.status
}

const getOrderStatusColor = (order: Order) => {
  if (order.is_rescheduled) return 'info'
  return STATUS_COLORS[order.status] || 'warning'
}

const filteredOrders = computed(() => {
  let result = [...orders.value]
  if (orderStatusFilter.value) {
    if (orderStatusFilter.value === 'rescheduled') {
      result = result.filter(o => o.is_rescheduled)
    } else {
      result = result.filter(o => o.status === orderStatusFilter.value && !o.is_rescheduled)
    }
  }
  result.sort((a, b) => (a.delivery_sequence || 999) - (b.delivery_sequence || 999))
  return result
})

const canSign = computed(() => {
  return (
    signForm.value.delivered_quantity > 0 &&
    signForm.value.recipient_signature.trim() !== ''
  )
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

const selectOrder = async (order: Order) => {
  selectedOrder.value = order
  signForm.value = {
    delivered_quantity: order.quantity,
    returned_empty_buckets: 0,
    recipient_signature: '',
    note: ''
  }

  try {
    const [customerData, exceptionsData] = await Promise.all([
      $fetch<Customer>(`${config.public.apiBase}/customers/${order.customer_id}`),
      $fetch<ExceptionReport[]>(`${config.public.apiBase}/exceptions?route_id=${routeId.value}`)
    ])
    customer.value = customerData
    orderExceptions.value = exceptionsData.filter(e => e.order_id === order.id)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const loadRouteDetail = async () => {
  try {
    const data = await $fetch<Route>(`${config.public.apiBase}/routes/${routeId.value}`)
    routeData.value = data
    orders.value = data.orders || []
  } catch (error) {
    console.error('加载路线详情失败:', error)
  }
}

const startRoute = async () => {
  try {
    await $fetch(`${config.public.apiBase}/routes/${routeId.value}/start`, {
      method: 'POST'
    })
    await loadRouteDetail()
  } catch (error) {
    console.error('开始路线失败:', error)
  }
}

const completeRoute = async () => {
  if (!confirm('确定要完成这条路线吗？')) return
  try {
    await $fetch(`${config.public.apiBase}/routes/${routeId.value}/complete`, {
      method: 'POST'
    })
    await loadRouteDetail()
  } catch (error: any) {
    console.error('完成路线失败:', error)
    const message = error?.data?.detail || '完成路线失败，请重试'
    alert(message)
  }
}

const submitDelivery = async () => {
  if (!selectedOrder.value) return

  try {
    await $fetch(`${config.public.apiBase}/orders/${selectedOrder.value.id}/deliver`, {
      method: 'POST',
      body: {
        ...signForm.value,
        signed_photo_url: `https://picsum.photos/400/300?random=${Date.now()}`
      }
    })
    await loadRouteDetail()
    const updatedOrder = orders.value.find(o => o.id === selectedOrder.value!.id)
    if (updatedOrder) {
      selectOrder(updatedOrder)
    }
  } catch (error) {
    console.error('签收失败:', error)
    alert('签收失败，请重试')
  }
}

const submitException = async () => {
  if (!selectedOrder.value) return

  try {
    await $fetch(`${config.public.apiBase}/exceptions`, {
      method: 'POST',
      body: {
        order_id: selectedOrder.value.id,
        route_id: routeId.value,
        ...exceptionForm.value,
        photos: [`https://picsum.photos/400/300?random=${Date.now()}`]
      }
    })
    showExceptionModal.value = false
    exceptionForm.value = { type: 'shortage', title: '', description: '' }
    await loadRouteDetail()
    const updatedOrder = orders.value.find(o => o.id === selectedOrder.value!.id)
    if (updatedOrder) {
      selectOrder(updatedOrder)
    }
  } catch (error) {
    console.error('上报异常失败:', error)
    alert('上报失败，请重试')
  }
}

onMounted(() => {
  loadRouteDetail()
})
</script>
