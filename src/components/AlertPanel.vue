<script setup lang="ts">
import { computed } from 'vue'
import { useSuppliesStore } from '@/stores/supplies'
import { useUserStore } from '@/stores/user'

const suppliesStore = useSuppliesStore()
const userStore = useUserStore()

const alerts = computed(() => {
  const result = []
  
  if (suppliesStore.pendingReviewCount > 0) {
    result.push({
      type: 'review',
      title: '待审核申请',
      count: suppliesStore.pendingReviewCount,
      message: `有 ${suppliesStore.pendingReviewCount} 条申请等待审核`,
      level: 'warning'
    })
  }
  
  if (suppliesStore.urgentCount > 0) {
    result.push({
      type: 'urgent',
      title: '紧急需求',
      count: suppliesStore.urgentCount,
      message: `有 ${suppliesStore.urgentCount} 条特急申请需优先处理`,
      level: 'danger'
    })
  }
  
  if (suppliesStore.documentAlertCount > 0) {
    result.push({
      type: 'document',
      title: '证件截点提醒',
      count: suppliesStore.documentAlertCount,
      message: `${suppliesStore.documentAlertCount} 个证件即将到期`,
      level: 'warning'
    })
  }
  
  if (suppliesStore.paymentAlertCount > 0) {
    result.push({
      type: 'payment',
      title: '付款提醒',
      count: suppliesStore.paymentAlertCount,
      message: `${suppliesStore.paymentAlertCount} 笔款项即将到期`,
      level: 'warning'
    })
  }
  
  return result
})
</script>

<template>
  <div class="alert-panel">
    <div
      v-for="alert in alerts"
      :key="alert.type"
      class="alert-item"
      :class="alert.level"
    >
      <div class="alert-icon">
        <el-icon v-if="alert.level === 'danger'"><Warning /></el-icon>
        <el-icon v-else><Bell /></el-icon>
      </div>
      <div class="alert-content">
        <div class="alert-title">
          {{ alert.title }}
          <span class="alert-badge">{{ alert.count }}</span>
        </div>
        <div class="alert-message">{{ alert.message }}</div>
      </div>
    </div>
    
    <div v-if="alerts.length === 0" class="no-alerts">
      <el-icon><CircleCheck /></el-icon>
      <span>暂无待处理事项</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.alert-panel {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 8px;
  min-width: 240px;
  flex: 1;

  &.warning {
    background: #fdf6ec;
    border: 1px solid #faecd8;

    .alert-icon {
      color: #e6a23c;
    }

    .alert-badge {
      background: #e6a23c;
    }
  }

  &.danger {
    background: #fef0f0;
    border: 1px solid #fbc4c4;

    .alert-icon {
      color: #f56c6c;
    }

    .alert-badge {
      background: #f56c6c;
    }
  }

  .alert-icon {
    font-size: 24px;
  }

  .alert-content {
    .alert-title {
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .alert-badge {
      color: #fff;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
    }

    .alert-message {
      color: #606266;
      font-size: 13px;
    }
  }
}

.no-alerts {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  color: #67c23a;
  background: #f0f9eb;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
}
</style>
