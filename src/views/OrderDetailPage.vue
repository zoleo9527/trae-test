<template>
  <div class="order-detail-page">
    <el-page-header @back="$router.back()" title="返回订单列表" />
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📋 订单详情</span>
              <div>
                <el-tag v-if="order?.isAbnormal" type="danger" style="margin-right: 10px;">
                  {{ getAbnormalTypeText(order?.abnormalType) }}
                </el-tag>
                <el-tag :type="getStatusType(order?.status)">
                  {{ getStatusLabel(order?.status) }}
                </el-tag>
              </div>
            </div>
          </template>
          
          <div v-if="order" class="order-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="申请时间">{{ order.applyTime }}</el-descriptions-item>
              <el-descriptions-item label="会员">{{ order.memberName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ order.memberPhone }}</el-descriptions-item>
              <el-descriptions-item label="兑换门店">{{ order.storeName }}</el-descriptions-item>
              <el-descriptions-item label="当前处理">
                <el-tag :type="getRoleType(order.currentHandler)">
                  {{ getRoleLabel(order.currentHandler) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="兑换商品" :span="2">
                <div class="product-item">
                  <span class="product-image">{{ order.productImage }}</span>
                  <div>
                    <div class="product-name">{{ order.productName }}</div>
                    <div class="product-points">
                      {{ order.pointsRequired.toLocaleString() }} 积分 × {{ order.quantity }} = 
                      <strong style="color: #f56c6c;">{{ order.totalPoints.toLocaleString() }} 积分</strong>
                    </div>
                  </div>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="核销码" v-if="order.verifyCode" :span="2">
                <el-input :value="order.verifyCode" readonly style="width: 200px;">
                  <template #append>
                    <el-button @click="copyCode">复制</el-button>
                  </template>
                </el-input>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <div class="timeline-section">
              <h4>⏱️ 处理进度</h4>
              <el-steps :active="getCurrentStep()" finish-status="success">
                <el-step title="申请兑换" :description="order.applyTime" />
                <el-step title="店长确认" :description="order.confirmTime || '待确认'" />
                <el-step title="仓管发货" :description="order.shipTime || '待发货'" />
                <el-step title="门店收货" :description="order.deliverTime || '待收货'" />
                <el-step title="到店核销" :description="order.verifyTime || '待核销'" />
              </el-steps>
            </div>

            <el-divider v-if="order.isAbnormal" />

            <el-alert 
              v-if="order.isAbnormal"
              :title="`异常类型：${getAbnormalTypeText(order.abnormalType)}`"
              :description="order.abnormalRemark"
              type="error"
              :closable="false"
              show-icon
              style="margin-bottom: 20px;"
            />

            <div v-if="order.remark" class="remark-section">
              <el-tag type="info" size="small">备注</el-tag>
              <span class="remark-text">{{ order.remark }}</span>
            </div>

            <div class="action-section">
              <el-button 
                v-if="canConfirm" 
                type="primary" 
                size="large"
                @click="handleConfirm"
              >
                确认订单
              </el-button>
              <el-button 
                v-if="canShip" 
                type="primary" 
                size="large"
                @click="handleShip"
              >
                确认发货
              </el-button>
              <el-button 
                v-if="canDeliver" 
                type="success" 
                size="large"
                @click="handleDeliver"
              >
                确认收货
              </el-button>
              <el-button 
                v-if="canVerify" 
                type="success" 
                size="large"
                @click="showVerifyDialog = true"
              >
                去核销
              </el-button>
              <el-button 
                v-if="canResolve" 
                type="warning" 
                size="large"
                @click="showResolveDialog = true"
              >
                🛠️ 解除异常
              </el-button>
              <el-button 
                v-if="canCancel" 
                type="danger" 
                size="large"
                @click="showCancelDialog = true"
              >
                取消订单
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>📝 操作记录</span>
          </template>
          <div v-if="order" class="operation-logs">
            <div class="log-item">
              <div class="log-dot"></div>
              <div class="log-content">
                <div class="log-title">申请兑换 - 冻结积分与库存</div>
                <div class="log-time">{{ order.applyTime }}</div>
              </div>
            </div>
            <div class="log-item" v-if="order.confirmTime">
              <div class="log-dot"></div>
              <div class="log-content">
                <div class="log-title">订单已确认 - {{ order.confirmBy }}</div>
                <div class="log-time">{{ order.confirmTime }}</div>
              </div>
            </div>
            <div class="log-item" v-if="order.shipTime">
              <div class="log-dot"></div>
              <div class="log-content">
                <div class="log-title">已发货（扣减库存）- {{ order.shipBy }}</div>
                <div class="log-time">{{ order.shipTime }}</div>
              </div>
            </div>
            <div class="log-item" v-if="order.deliverTime">
              <div class="log-dot"></div>
              <div class="log-content">
                <div class="log-title">已送达门店</div>
                <div class="log-time">{{ order.deliverTime }}</div>
              </div>
            </div>
            <div class="log-item" v-if="order.verifyTime">
              <div class="log-dot success"></div>
              <div class="log-content">
                <div class="log-title">已核销（扣减积分）- {{ order.verifyBy }}</div>
                <div class="log-time">{{ order.verifyTime }}</div>
              </div>
            </div>
            <div class="log-item" v-if="order.cancelTime">
              <div class="log-dot danger"></div>
              <div class="log-content">
                <div class="log-title">已取消（解冻积分与库存）- {{ order.cancelBy }}</div>
                <div class="log-time">{{ order.cancelTime }}</div>
                <div class="log-reason">原因: {{ order.cancelReason }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card v-if="order?.isAbnormal && order?.abnormalType === 'sync_failed'" style="margin-top: 20px;">
          <template #header>
            <span>🔗 联名商品同步</span>
          </template>
          <div class="sync-section">
            <p class="sync-desc">该订单涉及联名商品，需先完成库存同步才能继续处理</p>
            <el-button 
              v-if="canSync" 
              type="primary" 
              @click="handleSyncProduct"
              :loading="syncing"
            >
              重试同步
            </el-button>
            <el-button type="info" link @click="$router.push('/products')">
              查看商品详情
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showVerifyDialog" title="核销确认" width="400px">
      <el-form :model="verifyForm" label-width="80px">
        <el-form-item label="核销码">
          <el-input v-model="verifyForm.code" placeholder="请输入6位核销码" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleVerify">确认核销</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCancelDialog" title="取消订单" width="400px">
      <el-alert 
        title="取消后将自动解冻已冻结的积分和库存" 
        type="warning" 
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCancelDialog = false">取消</el-button>
        <el-button type="danger" @click="handleCancel">确认取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResolveDialog" title="解除异常" width="450px">
      <el-alert 
        :title="`异常类型：${getAbnormalTypeText(order?.abnormalType)}`"
        :description="order?.abnormalRemark"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />

      <el-alert 
        v-if="order?.abnormalType === 'stock_mismatch'"
        :title="`库存未补足：当前可用 ${resolveCheckInfo.availableStock}，订单需求 ${resolveCheckInfo.requiredStock}`"
        description="请先前往商品页调整库存，补足后再解除异常"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />

      <el-alert 
        v-if="order?.abnormalType === 'sync_failed'"
        :title="resolveCheckInfo.syncStatusText"
        description="请先前往商品页完成联名商品库存同步，同步成功后再解除异常"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />

      <el-form :model="resolveForm" label-width="80px">
        <el-form-item label="处理方案">
          <el-radio-group v-model="resolveForm.action">
            <el-radio label="resolve" :disabled="!canResolveAbnormal">解除异常，继续流转</el-radio>
            <el-radio label="cancel">取消订单</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="resolveForm.remark" type="textarea" :rows="3" placeholder="请输入处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" @click="handleResolve" :disabled="resolveForm.action === 'resolve' && !canResolveAbnormal">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore, useOrderStore, useProductStore } from '@/stores'
import { ExchangeOrderStatusLabels, UserRole } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const productStore = useProductStore()

const orderId = route.params.id as string
const order = computed(() => orderStore.getOrderById(orderId))

const showVerifyDialog = ref(false)
const showCancelDialog = ref(false)
const showResolveDialog = ref(false)
const verifyForm = ref({ code: '' })
const cancelForm = ref({ reason: '' })
const resolveForm = ref({ action: 'resolve', remark: '' })
const syncing = ref(false)

const product = computed(() => {
  if (!order.value) return null
  return productStore.getProductById(order.value.productId)
})

const getStatusLabel = (status?: string) => {
  if (!status) return ''
  return ExchangeOrderStatusLabels[status as keyof typeof ExchangeOrderStatusLabels] || status
}

const getStatusType = (status?: string) => {
  const types: Record<string, string> = {
    'pending': 'warning',
    'confirmed': 'primary',
    'shipped': 'info',
    'delivered': 'success',
    'verified': 'success',
    'cancelled': 'danger'
  }
  return types[status || ''] || 'info'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'store_manager': '店长',
    'planner': '企划',
    'warehouse': '仓管'
  }
  return labels[role] || role
}

const getRoleType = (role: string) => {
  const types: Record<string, string> = {
    'store_manager': 'primary',
    'planner': 'success',
    'warehouse': 'warning'
  }
  return types[role] || 'info'
}

const getAbnormalTypeText = (type?: string) => {
  const texts: Record<string, string> = {
    'stock_mismatch': '库存异常',
    'sync_failed': '同步失败',
    'timeout': '超时预警'
  }
  return texts[type || ''] || '异常'
}

const getCurrentStep = () => {
  if (!order.value) return 0
  const map: Record<string, number> = {
    'pending': 0,
    'confirmed': 1,
    'shipped': 2,
    'delivered': 3,
    'verified': 4,
    'cancelled': 0
  }
  return map[order.value.status] || 0
}

const canConfirm = computed(() => {
  const user = authStore.currentUser
  return user?.role === UserRole.STORE_MANAGER && 
         order.value?.status === 'pending' &&
         order.value?.storeId === user.storeId &&
         !order.value?.isAbnormal
})

const canShip = computed(() => {
  return authStore.currentUser?.role === UserRole.WAREHOUSE && 
         order.value?.status === 'confirmed' &&
         !order.value?.isAbnormal
})

const canDeliver = computed(() => {
  const user = authStore.currentUser
  return user?.role === UserRole.STORE_MANAGER && 
         order.value?.status === 'shipped' &&
         order.value?.storeId === user.storeId &&
         !order.value?.isAbnormal
})

const canVerify = computed(() => {
  const user = authStore.currentUser
  return user?.role === UserRole.STORE_MANAGER && 
         order.value?.status === 'delivered' &&
         order.value?.storeId === user.storeId &&
         !order.value?.isAbnormal
})

const canResolve = computed(() => {
  const user = authStore.currentUser
  return user?.role === UserRole.PLANNER && 
         order.value?.isAbnormal
})

const canResolveAbnormal = computed(() => {
  if (!order.value || !product.value) return false
  if (order.value.abnormalType === 'stock_mismatch') {
    return product.value.availableStock >= order.value.quantity
  }
  if (order.value.abnormalType === 'sync_failed') {
    return product.value.syncStatus === 'synced'
  }
  return true
})

const resolveCheckInfo = computed(() => {
  const info: Record<string, any> = {
    availableStock: 0,
    requiredStock: 0,
    syncStatusText: ''
  }
  if (order.value && product.value) {
    info.availableStock = product.value.availableStock
    info.requiredStock = order.value.quantity
    if (order.value.abnormalType === 'sync_failed') {
      const statusMap: Record<string, string> = {
        'synced': '已同步',
        'failed': '同步失败',
        'pending': '同步中',
        'not_synced': '未同步'
      }
      info.syncStatusText = `联名商品同步状态：${statusMap[product.value.syncStatus || 'not_synced'] || '未知'}`
    }
  }
  return info
})

const canCancel = computed(() => {
  const user = authStore.currentUser
  if (!order.value || !user) return false
  if (!['pending', 'confirmed'].includes(order.value.status)) return false
  if (user.role === UserRole.STORE_MANAGER && order.value.storeId !== user.storeId) return false
  return true
})

const canSync = computed(() => {
  return authStore.currentUser?.role === UserRole.PLANNER && 
         product.value?.isCoBranded
})

const copyCode = () => {
  if (order.value?.verifyCode) {
    navigator.clipboard.writeText(order.value.verifyCode)
    ElMessage.success('核销码已复制')
  }
}

const handleConfirm = () => {
  const user = authStore.currentUser
  if (!user) return
  
  const result = orderStore.confirmOrder(orderId, user)
  if (result.success) {
    ElMessage.success('订单已确认')
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const handleShip = () => {
  const user = authStore.currentUser
  if (!user) return
  
  const result = orderStore.shipOrder(orderId, user)
  if (result.success) {
    ElMessage.success('已发货，库存已扣减')
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const handleDeliver = () => {
  const user = authStore.currentUser
  if (!user) return
  
  const result = orderStore.deliverOrder(orderId, user)
  if (result.success) {
    ElMessage.success('已确认收货，核销码已生成')
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const handleVerify = () => {
  const user = authStore.currentUser
  if (!user || !order.value?.verifyCode) return
  
  const result = orderStore.verifyOrder(orderId, verifyForm.value.code, user)
  if (result.success) {
    ElMessage.success('核销成功，积分已扣减')
    showVerifyDialog.value = false
  } else {
    ElMessage.error(result.message || '核销失败')
  }
}

const handleCancel = () => {
  const user = authStore.currentUser
  if (!user || !cancelForm.value.reason) {
    ElMessage.warning('请填写取消原因')
    return
  }
  
  const result = orderStore.cancelOrder(orderId, cancelForm.value.reason, user)
  if (result.success) {
    ElMessage.success('订单已取消，积分和库存已解冻')
    showCancelDialog.value = false
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const handleResolve = () => {
  const user = authStore.currentUser
  if (!user || !resolveForm.value.remark) {
    ElMessage.warning('请填写处理说明')
    return
  }

  if (resolveForm.value.action === 'cancel') {
    const result = orderStore.cancelOrder(orderId, resolveForm.value.remark, user)
    if (result.success) {
      ElMessage.success('订单已取消')
      showResolveDialog.value = false
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } else {
    const result = orderStore.resolveAbnormal(orderId, resolveForm.value.remark, user)
    if (result.success) {
      ElMessage.success('异常已解除，订单已恢复流转')
      showResolveDialog.value = false
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  }
}

const handleSyncProduct = () => {
  const user = authStore.currentUser
  if (!user || !product.value) return

  syncing.value = true
  const result = productStore.syncCoBrandedProduct(product.value.id, user)
  
  if (result) {
    ElMessage.info('同步中，请稍候...')
    setTimeout(() => {
      syncing.value = false
      if (product.value?.syncStatus === 'synced') {
        ElMessage.success('同步成功')
        if (order.value?.isAbnormal && order.value?.abnormalType === 'sync_failed') {
          orderStore.resolveAbnormal(orderId, '联名商品同步成功，异常解除', user)
        }
      } else {
        ElMessage.error('同步失败，请重试')
      }
    }, 2500)
  } else {
    syncing.value = false
    ElMessage.error('同步操作失败')
  }
}
</script>

<style scoped>
.order-detail-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.product-image {
  font-size: 40px;
}

.product-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.product-points {
  margin-top: 5px;
  font-size: 14px;
  color: #666;
}

.timeline-section h4 {
  margin-bottom: 20px;
  color: #333;
}

.remark-section {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.remark-text {
  margin-left: 10px;
  color: #666;
  font-size: 13px;
}

.action-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 20px;
  flex-wrap: wrap;
}

.operation-logs {
  position: relative;
  padding-left: 20px;
}

.log-item {
  position: relative;
  padding-bottom: 25px;
  padding-left: 20px;
  border-left: 2px solid #e8e8e8;
}

.log-item:last-child {
  border-left-color: transparent;
}

.log-dot {
  position: absolute;
  left: -7px;
  top: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #409eff;
}

.log-dot.success {
  background: #67c23a;
  box-shadow: 0 0 0 2px #67c23a;
}

.log-dot.danger {
  background: #f56c6c;
  box-shadow: 0 0 0 2px #f56c6c;
}

.log-title {
  font-weight: 500;
  color: #333;
}

.log-time {
  font-size: 12px;
  color: #999;
  margin-top: 3px;
}

.log-reason {
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}

.sync-section {
  padding: 10px 0;
}

.sync-desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 15px;
  line-height: 1.6;
}
</style>
