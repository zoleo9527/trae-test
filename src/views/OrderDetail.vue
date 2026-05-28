<template>
  <div class="order-detail">
    <div class="page-header flex-between">
      <div>
        <button class="btn btn-default" @click="goBack">← 返回列表</button>
        <h2 class="page-title" style="margin-top: 12px">
          订单详情
          <span class="order-no">{{ order?.orderNo }}</span>
        </h2>
      </div>
      <div class="header-actions flex gap-sm">
        <button v-if="currentRole === 'business'"
                class="btn btn-warning"
                @click="showAfterSaleModal = true">
          发起售后
        </button>
        <button v-if="currentRole === 'warehouse' && (order?.status === 'production' || order?.status === 'partial_shipped')"
                class="btn btn-primary"
                @click="showShipmentModal = true">
          登记发货
        </button>
      </div>
    </div>

    <div class="detail-grid">
      <div class="card info-card">
        <div class="card-header">
          <h3 class="card-title">订单信息</h3>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">客户</span>
              <span class="info-value">{{ order?.customer }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">产品</span>
              <span class="info-value">{{ order?.productName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数量</span>
              <span class="info-value">{{ order?.quantity }} 件</span>
            </div>
            <div class="info-item">
              <span class="info-label">金额</span>
              <span class="info-value">¥{{ order?.amount.toLocaleString() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">打样版本</span>
              <span class="tag tag-primary">{{ order?.sampleVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态</span>
              <span class="tag" :class="'tag-' + statusConfig[order?.status]?.type">
                {{ statusConfig[order?.status]?.label }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ formatTime(order?.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建人</span>
              <span class="info-value">{{ order?.createdBy }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card shipment-card">
        <div class="card-header">
          <h3 class="card-title">发货记录</h3>
        </div>
        <div class="card-body">
          <div v-if="!order?.shipments?.length" class="empty-state">
            暂无发货记录
          </div>
          <div v-else class="shipment-list">
            <div v-for="shipment in order?.shipments" :key="shipment.id" class="shipment-item">
              <div class="shipment-header">
                <span class="courier">{{ shipment.courier }}</span>
                <span class="quantity">{{ shipment.quantity }} 件</span>
              </div>
              <div class="tracking-no">单号：{{ shipment.trackingNo }}</div>
              <div class="shipment-footer">
                <span>{{ formatTime(shipment.createdAt) }}</span>
                <span>{{ shipment.createdBy }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card aftersales-card">
      <div class="card-header">
        <h3 class="card-title">售后记录</h3>
      </div>
      <div class="card-body">
        <div v-if="!order?.afterSales?.length" class="empty-state">
          暂无售后记录
        </div>
        <div v-else class="aftersales-list">
          <div v-for="as in order?.afterSales" :key="as.id" class="aftersale-item">
            <div class="aftersale-header">
              <span class="type-badge" :class="as.type">{{ as.type === 'refund' ? '💰 退款' : '📦 补单' }}</span>
              <span class="tag" :class="afterSaleStatusConfig[as.status].type">
                {{ afterSaleStatusConfig[as.status].label }}
              </span>
              <span class="amount">¥{{ as.amount.toLocaleString() }}</span>
            </div>
            <div class="aftersale-reason">{{ as.reason }}</div>
            <div class="aftersale-items">
              <div v-for="(item, idx) in as.items" :key="idx" class="item-row">
                <span>{{ item.name }}</span>
                <span>{{ item.quantity }} 件</span>
                <span>¥{{ item.price }}</span>
              </div>
            </div>
            <div class="aftersale-log">
              <div class="log-title">处理记录</div>
              <div class="log-list">
                <div v-for="(log, idx) in as.logs" :key="idx" class="log-item">
                  <span class="log-time">{{ formatTime(log.time) }}</span>
                  <span class="log-action">{{ log.action }}</span>
                  <span class="log-operator">{{ log.operator }}</span>
                  <span class="log-remark">{{ log.remark }}</span>
                </div>
              </div>
            </div>
            <div v-if="canProcessAfterSale(as)" class="aftersale-actions">
              <button v-if="currentRole === 'sample' && as.status === 'pending'"
                      class="btn btn-success btn-sm"
                      @click="processAfterSale(as.id, 'approved', '审核通过')">
                审核通过
              </button>
              <button v-if="currentRole === 'sample' && as.status === 'pending'"
                      class="btn btn-danger btn-sm"
                      @click="processAfterSale(as.id, 'rejected', '审核拒绝')">
                拒绝
              </button>
              <button v-if="currentRole === 'warehouse' && as.type === 'reorder' && as.status === 'approved'"
                      class="btn btn-primary btn-sm"
                      @click="processAfterSale(as.id, 'processing', '开始处理补单')">
                开始处理
              </button>
              <button v-if="(currentRole === 'warehouse' && as.type === 'reorder') || (currentRole === 'sample' && as.type === 'refund') && as.status === 'processing'"
                      class="btn btn-success btn-sm"
                      @click="processAfterSale(as.id, 'completed', '处理完成')">
                完成
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card history-card">
      <div class="card-header flex-between">
        <h3 class="card-title">历史追踪</h3>
        <button v-if="currentRole === 'business'"
                class="btn btn-default btn-sm"
                @click="showRemarkModal = true">
          添加备注
        </button>
      </div>
      <div class="card-body">
        <div class="timeline">
          <div v-for="h in order?.history" :key="h.id"
               class="timeline-item"
               :class="getHistoryType(h.action)">
            <div class="timeline-time">{{ formatTime(h.time) }}</div>
            <div class="timeline-content">
              <div class="timeline-action">{{ h.action }}</div>
              <div class="timeline-remark">{{ h.remark }}</div>
              <div class="timeline-meta">
                <span>{{ h.operator }}</span>
                <span class="role-tag">{{ getRoleName(h.operatorRole) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAfterSaleModal" class="modal-overlay" @click.self="showAfterSaleModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>发起售后</h3>
          <button class="close-btn" @click="showAfterSaleModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>售后类型</label>
            <select v-model="afterSaleForm.type" class="select full-width">
              <option value="reorder">补单</option>
              <option value="refund">退款</option>
            </select>
          </div>
          <div class="form-group">
            <label>原因说明</label>
            <textarea v-model="afterSaleForm.reason" class="input full-width" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>涉及金额</label>
            <input v-model.number="afterSaleForm.amount" type="number" class="input full-width" />
          </div>
          <div class="form-group">
            <label>涉及商品</label>
            <div v-for="(item, idx) in afterSaleForm.items" :key="idx" class="item-input-row">
              <input v-model="item.name" placeholder="商品名称" class="input" />
              <input v-model.number="item.quantity" type="number" placeholder="数量" class="input" style="width: 100px" />
              <input v-model.number="item.price" type="number" placeholder="单价" class="input" style="width: 100px" />
            </div>
            <button class="btn btn-default btn-sm" @click="addAfterSaleItem">+ 添加商品</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAfterSaleModal = false">取消</button>
          <button class="btn btn-primary" @click="submitAfterSale">提交</button>
        </div>
      </div>
    </div>

    <div v-if="showShipmentModal" class="modal-overlay" @click.self="showShipmentModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>登记发货</h3>
          <button class="close-btn" @click="showShipmentModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>快递公司</label>
            <select v-model="shipmentForm.courier" class="select full-width">
              <option value="顺丰">顺丰</option>
              <option value="京东">京东</option>
              <option value="圆通">圆通</option>
              <option value="中通">中通</option>
            </select>
          </div>
          <div class="form-group">
            <label>快递单号</label>
            <input v-model="shipmentForm.trackingNo" class="input full-width" />
          </div>
          <div class="form-group">
            <label>发货数量</label>
            <input v-model.number="shipmentForm.quantity" type="number" class="input full-width" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showShipmentModal = false">取消</button>
          <button class="btn btn-primary" @click="submitShipment">确认发货</button>
        </div>
      </div>
    </div>

    <div v-if="showRemarkModal" class="modal-overlay" @click.self="showRemarkModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>添加备注</h3>
          <button class="close-btn" @click="showRemarkModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>备注内容</label>
            <textarea v-model="remarkContent" class="input full-width" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showRemarkModal = false">取消</button>
          <button class="btn btn-primary" @click="submitRemark">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { orders, currentRole } = storeToRefs(appStore)

const order = computed(() => orders.value.find(o => o.id === parseInt(route.params.id)))

const showAfterSaleModal = ref(false)
const showShipmentModal = ref(false)
const showRemarkModal = ref(false)
const remarkContent = ref('')

const afterSaleForm = ref({
  type: 'reorder',
  reason: '',
  amount: 0,
  items: [{ name: '', quantity: 0, price: 0 }]
})

const shipmentForm = ref({
  courier: '顺丰',
  trackingNo: '',
  quantity: 0
})

const statusConfig = {
  production: { label: '生产中', type: 'primary' },
  partial_shipped: { label: '部分发货', type: 'warning' },
  shipped: { label: '已发货', type: 'default' },
  after_sale: { label: '售后中', type: 'error' },
  completed: { label: '已完成', type: 'success' }
}

const afterSaleStatusConfig = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已审核', type: 'primary' },
  processing: { label: '处理中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  rejected: { label: '已拒绝', type: 'error' }
}

const roleNames = {
  business: '项目商务',
  sample: '打样跟单',
  warehouse: '仓配协调'
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function getRoleName(role) {
  return roleNames[role] || role
}

function getHistoryType(action) {
  if (action.includes('售后') || action.includes('退款')) return 'error'
  if (action.includes('完成')) return 'success'
  if (action.includes('异常')) return 'warning'
  return ''
}

function goBack() {
  router.push('/orders')
}

function canProcessAfterSale(as) {
  if (currentRole.value === 'sample' && as.status === 'pending') return true
  if (currentRole.value === 'warehouse' && as.type === 'reorder' && (as.status === 'approved' || as.status === 'processing')) return true
  if (currentRole.value === 'sample' && as.type === 'refund' && as.status === 'processing') return true
  return false
}

function processAfterSale(afterSaleId, status, remark) {
  appStore.updateAfterSaleStatus(order.value.id, afterSaleId, status, remark)
}

function addAfterSaleItem() {
  afterSaleForm.value.items.push({ name: '', quantity: 0, price: 0 })
}

function submitAfterSale() {
  appStore.createAfterSale(
    order.value.id,
    afterSaleForm.value.type,
    afterSaleForm.value.reason,
    afterSaleForm.value.amount,
    afterSaleForm.value.items.filter(i => i.name)
  )
  showAfterSaleModal.value = false
  afterSaleForm.value = {
    type: 'reorder',
    reason: '',
    amount: 0,
    items: [{ name: '', quantity: 0, price: 0 }]
  }
}

function submitShipment() {
  if (!shipmentForm.value.trackingNo && shipmentForm.value.quantity > 0) {
    appStore.updateShipment(order.value.id, shipmentForm.value)
    showShipmentModal.value = false
    shipmentForm.value = {
      courier: '顺丰',
      trackingNo: '',
      quantity: 0
    }
  }
}

function submitRemark() {
  if (remarkContent.value) {
    appStore.addOrderHistory(order.value.id, '添加备注', remarkContent.value)
    showRemarkModal.value = false
    remarkContent.value = ''
  }
}
</script>

<style scoped>
.order-detail {
  padding-bottom: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-no {
  font-family: monospace;
  font-size: 18px;
  color: #1890ff;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #8c8c8c;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
}

.shipment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shipment-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.shipment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.courier {
  font-weight: 500;
}

.quantity {
  color: #1890ff;
}

.tracking-no {
  font-family: monospace;
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}

.shipment-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8c8c8c;
}

.aftersales-card,
.history-card {
  margin-bottom: 20px;
}

.aftersales-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aftersale-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #faad14;
}

.aftersale-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.refund {
  background: #fff1f0;
  color: #f5222d;
}

.type-badge.reorder {
  background: #e6f7ff;
  color: #1890ff;
}

.amount {
  margin-left: auto;
  font-weight: 600;
  color: #f5222d;
}

.aftersale-reason {
  font-size: 13px;
  color: #595959;
  margin-bottom: 12px;
}

.aftersale-items {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.aftersale-log {
  margin-bottom: 12px;
}

.log-title {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-item {
  font-size: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.log-time {
  color: #8c8c8c;
}

.log-action {
  font-weight: 500;
}

.log-operator {
  color: #1890ff;
}

.log-remark {
  color: #595959;
}

.aftersale-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: #f0f0f0;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1890ff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #1890ff;
}

.timeline-item.warning::before {
  background: #faad14;
  box-shadow: 0 0 0 2px #faad14;
}

.timeline-item.error::before {
  background: #f5222d;
  box-shadow: 0 0 0 2px #f5222d;
}

.timeline-item.success::before {
  background: #52c41a;
  box-shadow: 0 0 0 2px #52c41a;
}

.timeline-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.timeline-action {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.timeline-remark {
  font-size: 13px;
  color: #595959;
  margin-bottom: 4px;
}

.timeline-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.role-tag {
  background: #f5f5f5;
  padding: 0 6px;
  border-radius: 3px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c8c;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
}

.full-width {
  width: 100%;
}

.item-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.item-input-row .input {
  flex: 1;
}
</style>