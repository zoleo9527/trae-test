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
                  <span class="order-badge">匹配订单</span>
                  <span class="order-no text-link" @click="goToOrder(result.matchedOrder.id)">
                    {{ result.matchedOrder.orderNo }}
                  </span>
                </div>
                <div class="order-info">
                  <span>{{ result.matchedOrder.customer }}</span>
                  <span>{{ result.matchedOrder.productName }}</span>
                </div>
                <div class="result-actions">
                  <button v-if="currentRole === 'warehouse'"
                          class="btn btn-primary btn-sm"
                          @click="quickShip(result.matchedOrder, result.code)">
                    快速发货
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
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
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
let scanner = null

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

  const matchedOrder = matchOrder(code)

  scanResults.value.unshift({
    code,
    time: dayjs().format('HH:mm:ss'),
    matchedOrder
  })

  if (scanResults.value.length > 20) {
    scanResults.value.pop()
  }
}

function matchOrder(code) {
  return orders.value.find(order => {
    if (order.orderNo.toLowerCase() === code.toLowerCase()) return true
    if (order.shipments && order.shipments.some(s => s.trackingNo === code)) return true
    return false
  })
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
  alert(`快速发货功能演示：\n订单: ${order.orderNo}\n单号: ${trackingNo}`)
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
</style>