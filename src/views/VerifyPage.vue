<template>
  <div class="verify-page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>✅ 快速核销</span>
          </template>
          
          <div class="verify-form">
            <el-input 
              v-model="verifyCode" 
              placeholder="请输入6位核销码" 
              size="large"
              maxlength="6"
              clearable
              @keyup.enter="handleQuickVerify"
            >
              <template #append>
                <el-button type="primary" @click="handleQuickVerify" :loading="verifying">
                  确认核销
                </el-button>
              </template>
            </el-input>
            
            <el-alert 
              title="提示" 
              type="info" 
              :closable="false"
              style="margin-top: 20px;"
            >
              <template #default>
                <p>1. 会员到店后出示核销码</p>
                <p>2. 输入核销码点击确认核销</p>
                <p>3. 核销成功后将商品交付会员</p>
              </template>
            </el-alert>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>📋 待核销订单</span>
          </template>
          
          <el-table :data="pendingVerifyOrders" size="small">
            <el-table-column prop="orderNo" label="订单号" width="140" />
            <el-table-column label="商品" width="150">
              <template #default="{ row }">
                {{ row.productImage }} {{ row.productName.slice(0, 8) }}
              </template>
            </el-table-column>
            <el-table-column prop="memberName" label="会员" width="80" />
            <el-table-column prop="verifyCode" label="核销码" width="100">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.verifyCode }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="verifyOrder(row)">
                  核销
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-empty v-if="pendingVerifyOrders.length === 0" description="暂无待核销订单" :image-size="100" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>📊 今日核销记录</span>
      </template>
      
      <el-table :data="todayVerifiedOrders">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="商品" width="200">
          <template #default="{ row }">
            {{ row.productImage }} {{ row.productName }}
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="100" />
        <el-table-column prop="totalPoints" label="积分" width="100" />
        <el-table-column prop="verifyCode" label="核销码" width="100" />
        <el-table-column prop="verifyBy" label="核销人" width="100" />
        <el-table-column prop="verifyTime" label="核销时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore, useOrderStore } from '@/stores'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const orderStore = useOrderStore()

const verifyCode = ref('')
const verifying = ref(false)

const pendingVerifyOrders = computed(() => {
  const user = authStore.currentUser
  if (!user) return []
  
  return orderStore.orders.filter(o => 
    o.status === 'delivered' && 
    o.storeId === user.storeId
  )
})

const todayVerifiedOrders = computed(() => {
  const user = authStore.currentUser
  if (!user) return []
  
  return orderStore.orders.filter(o => 
    o.status === 'verified' && 
    o.storeId === user.storeId &&
    o.verifyTime &&
    dayjs(o.verifyTime).isSame(dayjs(), 'day')
  )
})

const handleQuickVerify = () => {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    ElMessage.warning('请输入6位核销码')
    return
  }
  
  verifying.value = true
  
  setTimeout(() => {
    const order = orderStore.orders.find(o => o.verifyCode === verifyCode.value?.toUpperCase())
    if (!order) {
      ElMessage.error('核销码无效')
      verifying.value = false
      return
    }
    
    if (order.status !== 'delivered') {
      ElMessage.error('该订单状态不允许核销')
      verifying.value = false
      return
    }
    
    if (authStore.currentUser) {
      orderStore.verifyOrder(order.id, verifyCode.value.toUpperCase(), authStore.currentUser)
      ElMessage.success('核销成功！')
      verifyCode.value = ''
    }
    verifying.value = false
  }, 500)
}

const verifyOrder = (order: any) => {
  if (authStore.currentUser && order.verifyCode) {
    const success = orderStore.verifyOrder(order.id, order.verifyCode, authStore.currentUser)
    if (success) {
      ElMessage.success('核销成功！')
    }
  }
}
</script>

<style scoped>
.verify-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.verify-form {
  padding: 20px 0;
}
</style>
