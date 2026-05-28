<template>
  <div class="scan-page">
    <div class="page-header">
      <h2 class="page-title">扫码录入</h2>
      <p class="page-desc">扫码快递单号或订单号，快速关联订单操作</p>
    </div>

    <div class="scan-container">
      <div class="card scanner-card">
        <div class="card-header">
          <h3 class="card-title">扫码识别</h3>
        </div>
        <div class="card-body">
          <div v-if="!scannerActive" class="scanner-placeholder" @click="startScanner">
            <div class="scan-icon">📷</div>
            <p>点击开启摄像头扫码</p>
            <p class="hint">支持快递单条形码、订单号二维码</p>
          </div>
          <div v-else class="scanner-area">
            <video ref="videoRef" class="scanner-video" autoplay playsinline></video>
            <div class="scan-overlay">
              <div class="scan-frame"></div>
            </div>
            <button class="btn btn-danger stop-btn" @click="stopScanner">停止扫描</button>
          </div>
        </div>
      </div>

      <div class="card result-card">
        <div class="card-header flex-between">
          <h3 class="card-title">扫描结果</h3>
          <button class="btn btn-default btn-sm" @click="clearResults">清空</button>
        </div>
        <div class="card-body">
          <div v-if="scanResults.length === 0" class="empty-state">
            <div class="empty-icon">📦</div>
            <p>暂无扫描记录</p>
          </div>
          <div v-else class="scan-results">
            <div v-for="(result, index) in scanResults" :key="index" class="scan-result-item">
              <div class="result-header">
                <span class="result-code">{{ result.code }}</span>
                <span class="result-time">{{ result.time }}</span>
              </div>
              <div v-if="result.matchedOrder" class="result-matched">
                <div class="matched-order">
                  <span class="order-badge" :class="result.matchType">
                    {{ result.matchType === 'order' ? '订单号匹配' : '运单号匹配' }}
                  </span>
                  <span class="order-no text-link" @click="goToOrder(result.matchedOrder.id)">
                    {{ result.matchedOrder.orderNo }}
                  </span>
                </div>
                <div v-if="result.shipmentInfo" class="shipment-info">
                  <span class="tag tag-default">已发货</span>
                  <span>{{ result.shipmentInfo.courier }} {{ result.shipmentInfo.trackingNo }}</span>
                  <span>{{ result.shipmentInfo.quantity }} 件</span>
                </div>
                <div class="order-info">
                  <span>{{ result.matchedOrder.customer }}</span>
                  <span>{{ result.matchedOrder.productName }}</span>
                </div>
                <div class="result-actions">
                  <button v-if="canQuickShip(result)"
                          class="btn btn-primary btn-sm"
                          @click="quickShip(result.matchedOrder, result.code)">
                    快速发货
                  </button>
                  <button v-if="canAddShipment(result)"
                          class="btn btn-primary btn-sm"
                          @click="showAddShipmentModal(result)">
                    补充运单
                  </button>
                  <button v-if="result.isDuplicate" class="btn btn-warning btn-sm" disabled>
                    重复单号
                  </button>
                  <button v-if="result.isAfterSale" class="btn btn-warning btn-sm" disabled>
                    售后中
                  </button>
                  <button class="btn btn-default btn-sm" @click="goToOrder(result.matchedOrder.id)">
                    查看详情
                  </button>
                </div>
              </div>
              <div v-else class="result-no-match">
                <span class="tag tag-warning">未匹配</span>
                <span>未找到相关订单</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card manual-card">
      <div class="card-header">
        <h3 class="card-title">手动录入</h3>
      </div>
      <div class="card-body">
        <div class="manual-input-row">
          <input
            v-model="manualInput"
            type="text"
            class="input"
            placeholder="输入快递单号或订单号..."
            @keyup.enter="handleManualInput"
          />
          <button class="btn btn-primary" @click="handleManualInput">查询</button>
        </div>
      </div>
    </div>

    <div v-if="showAddShipment" class="modal-overlay" @click.self="showAddShipment = false">
      <div class="modal">
        <div class="modal-header">
          <h3>补充运单信息</h3>
          <button class="close-btn" @click="showAddShipment = false">×</button>
        </div>
        <div class="modal-body">
          <div class="order-summary">
            <p><strong>订单：</strong>{{ selectedResult?.matchedOrder?.orderNo }}</p>
            <p><strong>客户：</strong>{{ selectedResult?.matchedOrder?.customer }}</p>
            <p><strong>产品：</strong>{{ selectedResult?.matchedOrder?.productName }}</p>
            <p><strong>剩余发货：</strong>{{ remainingQuantity }} 件</p>
          </div>
          <div class="form-group">
            <label>快递公司</label>
            <select v-model="shipmentForm.courier" class="select full-width">
              <option value="顺丰">顺丰</option>
              <option value="京东">京东</option>
              <option value="圆通">圆通</option>
              <option value="中通">中通</option>
              <option value="扫码识别">扫码识别</option>
            </select>
          </div>
          <div class="form-group">
            <label>快递单号</label>
            <input v-model="shipmentForm.trackingNo" class="input full-width" placeholder="请输入真实快递单号" />
          </div>
          <div class="form-group">
            <label>发货数量</label>
            <input v-model.number="shipmentForm.quantity" type="number" class="input full-width" :placeholder="`最多 ${remainingQuantity} 件`" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAddShipment = false">取消</button>
          <button class="btn btn-primary" @click="submitAddShipment">确认发货</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import QrScanner from 'qr-scanner'
import dayjs from 'dayjs'

const router = useRouter()
const appStore = useAppStore()
const { orders, currentRole } = storeToRefs(appStore)

const videoRef = ref(null)
const scannerActive = ref(false)
const scanResults = ref([])
const manualInput = ref('')
const showAddShipment = ref(false)
const selectedResult = ref(null)
const shipmentForm = ref({
  courier: '顺丰',
  trackingNo: '',
  quantity: 0
})
let scanner = null

const remainingQuantity = computed(() => {
  if (!selectedResult.value?.matchedOrder) return 0
  const order = selectedResult.value.matchedOrder
  const shipped = order.shipments?.reduce((sum, s) => sum + s.quantity, 0) || 0
  return order.quantity - shipped
})

async function startScanner() {
  try {
    scanner = new QrScanner(videoRef.value, result => {
      handleScanResult(result.data)
    }, {
      highlightScanRegion: true,
      highlightCodeOutline: true
    })
    await scanner.start()
    scannerActive.value = true
  } catch (err) {
    alert('无法启动摄像头，请检查权限设置')
    console.error(err)
  }
}

function stopScanner() {
  if (scanner) {
    scanner.stop()
    scanner.destroy()
    scanner = null
  }
  scannerActive.value = false
}

function handleScanResult(code) {
  const existing = scanResults.value.find(r => r.code === code)
  if (existing) return

  const matchResult = matchOrder(code)

  scanResults.value.unshift({
    code,
    time: dayjs().format('HH:mm:ss'),
    matchedOrder: matchResult.order,
    matchType: matchResult.type,
    shipmentInfo: matchResult.shipment,
    isDuplicate: matchResult.isDuplicate,
    isAfterSale: matchResult.isAfterSale
  })

  if (scanResults.value.length > 20) {
    scanResults.value.pop()
  }
}

function matchOrder(code) {
  const result = {
    order: null,
    type: null,
    shipment: null,
    isDuplicate: false,
    isAfterSale: false
  }

  for (const order of orders.value) {
    if (order.orderNo.toLowerCase() === code.toLowerCase()) {
      result.order = order
      result.type = 'order'
      result.isAfterSale = order.status === 'after_sale'

      const isDuplicate = order.shipments && order.shipments.some(
        s => s.trackingNo.toLowerCase() === code.toLowerCase()
      )
      result.isDuplicate = isDuplicate
      return result
    }
  }

  for (const order of orders.value) {
    if (order.shipments) {
      const shipment = order.shipments.find(
        s => s.trackingNo.toLowerCase() === code.toLowerCase()
      )
      if (shipment) {
        result.order = order
        result.type = 'shipment'
        result.shipment = shipment
        result.isDuplicate = true
        result.isAfterSale = order.status === 'after_sale'
        return result
      }
    }
  }

  for (const order of orders.value) {
    if (order.shipments) {
      const allTrackingNos = order.shipments.map(s => s.trackingNo.toLowerCase())
      const isDuplicate = allTrackingNos.includes(code.toLowerCase())
      if (isDuplicate) {
        result.order = order
        result.type = 'duplicate'
        result.isDuplicate = true
        result.isAfterSale = order.status === 'after_sale'
        return result
      }
    }
  }

  return result
}

function canQuickShip(result) {
  if (currentRole.value !== 'warehouse') return false
  if (!result.matchedOrder) return false
  if (result.isDuplicate) return false
  if (result.matchType === 'order') return false
  if (result.matchType === 'shipment') return false
  if (result.isAfterSale) return false

  const remaining = result.matchedOrder.quantity -
    (result.matchedOrder.shipments?.reduce((sum, s) => sum + s.quantity, 0) || 0)
  return remaining > 0
}

function canAddShipment(result) {
  if (currentRole.value !== 'warehouse') return false
  if (!result.matchedOrder) return false
  if (result.isDuplicate && result.matchType !== 'order') return false
  if (result.isAfterSale) return false
  if (result.matchType !== 'order') return false

  const remaining = result.matchedOrder.quantity -
    (result.matchedOrder.shipments?.reduce((sum, s) => sum + s.quantity, 0) || 0)
  return remaining > 0
}

function showAddShipmentModal(result) {
  selectedResult.value = result
  shipmentForm.value = {
    courier: '顺丰',
    trackingNo: '',
    quantity: remainingQuantity.value
  }
  showAddShipment.value = true
}

function submitAddShipment() {
  if (!shipmentForm.value.trackingNo || shipmentForm.value.quantity <= 0) {
    alert('请填写完整的运单信息')
    return
  }
  if (shipmentForm.value.quantity > remainingQuantity.value) {
    alert(`发货数量不能超过剩余数量 ${remainingQuantity.value} 件`)
    return
  }

  try {
    appStore.updateShipment(selectedResult.value.matchedOrder.id, {
      courier: shipmentForm.value.courier,
      trackingNo: shipmentForm.value.trackingNo,
      quantity: shipmentForm.value.quantity
    })

    alert(`发货成功！\n订单: ${selectedResult.value.matchedOrder.orderNo}\n单号: ${shipmentForm.value.trackingNo}\n数量: ${shipmentForm.value.quantity} 件`)

    const result = scanResults.value.find(r => r.code === selectedResult.value.code)
    if (result) {
      const updated = matchOrder(selectedResult.value.code)
      result.matchedOrder = updated.order
      result.shipmentInfo = updated.shipment
      result.isDuplicate = true
    }

    showAddShipment.value = false
  } catch (err) {
    alert(err.message)
  }
}

function handleManualInput() {
  if (!manualInput.value.trim()) return
  handleScanResult(manualInput.value.trim())
  manualInput.value = ''
}

function goToOrder(orderId) {
  router.push(`/order/${orderId}`)
}

function quickShip(order, trackingNo) {
  const matchResult = matchOrder(trackingNo)
  if (matchResult.isDuplicate) {
    alert('该运单号已存在，无法重复发货')
    return
  }
  if (order.status === 'after_sale') {
    alert('该订单处于售后中，如需发货请先处理售后或在补单流程中操作')
    return
  }

  const remaining = order.quantity - (order.shipments?.reduce((sum, s) => sum + s.quantity, 0) || 0)
  if (remaining <= 0) {
    alert('该订单已全部发货完成')
    return
  }

  try {
    appStore.updateShipment(order.id, {
      courier: '扫码识别',
      trackingNo: trackingNo,
      quantity: remaining
    })

    alert(`快速发货成功！\n订单: ${order.orderNo}\n单号: ${trackingNo}\n数量: ${remaining} 件`)

    const result = scanResults.value.find(r => r.code === trackingNo)
    if (result) {
      const updated = matchOrder(trackingNo)
      result.matchedOrder = updated.order
      result.shipmentInfo = updated.shipment
      result.isDuplicate = true
    }
  } catch (err) {
    alert(err.message)
  }
}

function clearResults() {
  scanResults.value = []
}

onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
.scan-page {
  padding-bottom: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}

.page-desc {
  color: #8c8c8c;
  font-size: 13px;
}

.scan-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.scanner-card,
.result-card {
  min-height: 400px;
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

.scanner-placeholder {
  height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.scanner-placeholder:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.scan-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.scanner-placeholder p {
  font-size: 14px;
  color: #595959;
  margin-bottom: 4px;
}

.scanner-placeholder .hint {
  font-size: 12px;
  color: #8c8c8c;
}

.scanner-area {
  position: relative;
}

.scanner-video {
  width: 100%;
  height: 320px;
  object-fit: cover;
  border-radius: 8px;
  background: #000;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scan-frame {
  width: 200px;
  height: 200px;
  border: 2px solid #1890ff;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
}

.stop-btn {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8c8c8c;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.scan-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.scan-result-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #1890ff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-code {
  font-family: monospace;
  font-weight: 500;
  font-size: 13px;
}

.result-time {
  font-size: 12px;
  color: #8c8c8c;
}

.result-matched {
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.matched-order {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.order-badge {
  font-size: 11px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.order-badge.shipment {
  color: #1890ff;
  background: #e6f7ff;
}

.order-badge.duplicate {
  color: #faad14;
  background: #fffbe6;
}

.shipment-info {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #595959;
}

.shipment-info .tag {
  background: #e6f7ff;
  color: #1890ff;
}

.order-no {
  font-family: monospace;
  font-size: 13px;
}

.order-info {
  font-size: 12px;
  color: #595959;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-no-match {
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.manual-card {
  margin-bottom: 20px;
}

.manual-input-row {
  display: flex;
  gap: 12px;
}

.manual-input-row .input {
  flex: 1;
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
  width: 480px;
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

.order-summary {
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.order-summary p {
  margin: 4px 0;
  font-size: 13px;
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
</style>