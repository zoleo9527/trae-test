<script setup lang="ts">
import { computed } from 'vue'
import { useSuppliesStore } from '@/stores/supplies'
import { useUserStore } from '@/stores/user'
import type { SuppliesStatus } from '@/types'

const suppliesStore = useSuppliesStore()
const userStore = useUserStore()

const statusLabels: Record<SuppliesStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  reviewed: '已审核',
  rejected: '已驳回',
  supplier_assigned: '供应商已分配',
  in_progress: '执行中',
  completed: '已完成',
  paid: '已结算'
}

const statusColors: Record<SuppliesStatus, string> = {
  draft: 'info',
  pending_review: 'warning',
  reviewed: 'primary',
  rejected: 'danger',
  supplier_assigned: 'primary',
  in_progress: 'warning',
  completed: 'success',
  paid: 'success'
}

const urgencyLabels = {
  normal: '普通',
  urgent: '紧急',
  critical: '特急'
}

const urgencyColors = {
  normal: '',
  urgent: 'text-orange-500',
  critical: 'text-red-500 font-bold'
}

const filteredApps = computed(() => suppliesStore.filteredApplications)

const selectApp = (id: string) => {
  suppliesStore.selectApplication(id)
}
</script>

<template>
  <div class="application-list">
    <div v-if="filteredApps.length === 0" class="empty-state">
      <el-empty description="暂无申请记录" />
    </div>
    <div v-else class="app-cards">
      <div
        v-for="app in filteredApps"
        :key="app.id"
        class="app-card"
        :class="{ active: suppliesStore.selectedApplicationId === app.id }"
        @click="selectApp(app.id)"
      >
        <div class="card-header">
          <div class="app-info">
            <span class="app-no">{{ app.applicationNo }}</span>
            <el-tag :type="statusColors[app.status]" size="small">{{ statusLabels[app.status] }}</el-tag>
            <span v-if="app.items.some(i => i.urgency === 'critical')" class="critical-badge">特急</span>
          </div>
          <div class="vessel-name">{{ app.vesselName }}</div>
        </div>
        
        <div class="card-body">
          <div class="info-row">
            <span class="label">港口</span>
            <span class="value">{{ app.port }}</span>
          </div>
          <div class="info-row">
            <span class="label">靠泊</span>
            <span class="value">{{ app.berthDate }}</span>
          </div>
          <div class="info-row">
            <span class="label">申请人</span>
            <span class="value">{{ app.applicantName }}</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="items-preview">
            <span v-for="(item, idx) in app.items.slice(0, 2)" :key="item.id" class="item-tag">
              <span :class="urgencyColors[item.urgency]">{{ item.name }}</span>
            </span>
            <span v-if="app.items.length > 2" class="more-items">+{{ app.items.length - 2 }}</span>
          </div>
          <div class="amount">
            ¥{{ app.totalAmount.toLocaleString() }}
          </div>
        </div>

        <div v-if="app.currentHandlerName" class="current-handler">
          <el-icon><User /></el-icon>
          <span>处理人: {{ app.currentHandlerName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.application-list {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.app-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
  }

  &.active {
    border-color: #409eff;
    background: #f0f9ff;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .app-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .app-no {
      font-weight: 600;
      color: #303133;
      font-size: 14px;
    }

    .vessel-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .critical-badge {
    background: #f56c6c;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .card-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;

    .info-row {
      display: flex;
      gap: 8px;

      .label {
        color: #909399;
        min-width: 40px;
      }

      .value {
        color: #606266;
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;

    .items-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .item-tag {
        background: #f5f7fa;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        color: #606266;
      }

      .more-items {
        color: #909399;
        font-size: 12px;
      }
    }

    .amount {
      font-weight: 600;
      color: #f56c6c;
    }
  }

  .current-handler {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
