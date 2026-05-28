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
              :title="order.abnormalRemark"
              type="error"
              :closable="false"
              style="margin-bottom: 20px;"
            />

            <div class="action-section">
              <el-button 
                v-if="canConfirm" 
                type="primary" 
                size="large"
                @click="confirmOrder"
              >
                确认订单
              </el-button>
              <el-button 
                v-if="canShip" 
                type="primary" 
                size="large"
                @click="shipOrder"
              >
                确认发货
              </el-button>
              <el-button 
                v-if="canDeliver" 
                type="success" 
                size="large"
                @click="deliverOrder"
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
                <div class="log-title">申请兑换</div>
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
                <div class="log-title">已发货 - {{ order.shipBy }}</div>
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
                <div class="log-title">已核销 - {{ order.verifyBy }}</div>
                <div class="log-time">{{ order.verifyTime }}</div>
              </div>
            </div>
            <div class="log-item" v-if="order.cancelTime">
              <div class="log-dot danger"></div>
              <div class="log-content">
                <div class="log-title">已取消 - {{ order.cancelBy }}</div>
                <div class="log-time">{{ order.cancelTime }}</div>
                <div class="log-reason">原因: {{ order.cancelReason }}</div>
              </div>
            </div>
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
        <el-button type="primary" @click="verifyOrder">确认核销</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCancelDialog" title="取消订单" width="400px">
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCancelDialog = false">取消</el-button>
        <el-button type="danger" @click="cancelOrder">确认取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore, useOrderStore } from '@/stores'
import { ExchangeOrderStatusLabels, UserRole } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const orderId = route.params.id as string
const order = computed(() => orderStore.getOrderById(orderId))

const showVerifyDialog = ref(false)
const showCancelDialog = ref(false)
const verifyForm = ref({ code: '' })
const cancelForm = ref({ reason: '' })

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
         order.value?.storeId === user.storeId
})

const canShip = computed(() => {
  return authStore.currentUser?.role === UserRole.WAREHOUSE && 
         order.value?.status === 'confirmed'
})

const canDeliver = computed(() => {
  const user = authStore.currentUser
  return user?.role === UserRole.STORE_MANAGER && 
         order.value?.status === 'shipped' &&
         order.value?.storeId === user.storeId
})

const canVerify = computed(() => {
  const user = authStore.currentUser
  return user?.role === UserRole.STORE_MANAGER && 
         order.value?.status === 'delivered' &&
         order.value?.storeId === user.storeId
})

const canCancel = computed(() => {
  return order.value && 
         ['pending', 'confirmed'].includes(order.value.status) &&
         !order.value.isAbnormal
})

const copyCode = () => {
  if (order.value?.verifyCode) {
    navigator.clipboard.writeText(order.value.verifyCode)
    ElMessage.success('核销码已复制')
  }
}

const confirmOrder = () => {
  const user = authStore.currentUser
  if (!user) return
  
  orderStore.confirmOrder(orderId, user)
  ElMessage.success('订单已确认')
}

const shipOrder = () => {
  const user = authStore.currentUser
  if (!user) return
  
  orderStore.shipOrder(orderId, user)
  ElMessage.success('已发货')
}

const deliverOrder = () => {
  const user = authStore.currentUser
  if (!user) return
  
  orderStore.deliverOrder(orderId, user)
  ElMessage.success('已确认收货，核销码已生成')
}

const verifyOrder = () => {
  const user = authStore.currentUser
  if (!user || !order.value?.verifyCode) return
  
  if (verifyForm.value.code !== order.value.verifyCode) {
    ElMessage.error('核销码错误')
    return
  }
  
  const success = orderStore.verifyOrder(orderId, verifyForm.value.code, user)
  if (success) {
    ElMessage.success('核销成功')
    showVerifyDialog.value = false
  }
}

const cancelOrder = () => {
  const user = authStore.currentUser
  if (!user || !cancelForm.value.reason) {
    ElMessage.warning('请填写取消原因')
    return
  }
  
  orderStore.cancelOrder(orderId, cancelForm.value.reason, user)
  ElMessage.success('订单已取消')
  showCancelDialog.value = false
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

.action-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 20px;
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
</style>
