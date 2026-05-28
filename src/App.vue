<script setup lang="ts">
import { ref } from 'vue'
import { useSuppliesStore } from '@/stores/supplies'
import { useUserStore } from '@/stores/user'
import AlertPanel from '@/components/AlertPanel.vue'
import ApplicationList from '@/components/ApplicationList.vue'
import ApplicationDetail from '@/components/ApplicationDetail.vue'
import BatchReviewPanel from '@/components/BatchReviewPanel.vue'
import RoleSwitcher from '@/components/RoleSwitcher.vue'
import type { SuppliesStatus } from '@/types'

const suppliesStore = useSuppliesStore()
const userStore = useUserStore()
const batchReviewRef = ref<InstanceType<typeof BatchReviewPanel> | null>(null)

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待审核' },
  { value: 'reviewed', label: '已审核' },
  { value: 'rejected', label: '已驳回' },
  { value: 'supplier_assigned', label: '供应商已分配' },
  { value: 'in_progress', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'paid', label: '已结算' }
]

const handleFilterChange = (value: SuppliesStatus | 'all') => {
  suppliesStore.setFilterStatus(value)
}

const handleSearch = (value: string) => {
  suppliesStore.setSearchKeyword(value)
}

const openBatchReview = () => {
  batchReviewRef.value?.openBatchReview()
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">
          <el-icon :size="28"><Ship /></el-icon>
          船舶代理 - 补给申请与供应商对接
        </h1>
      </div>
      <div class="header-right">
        <RoleSwitcher />
      </div>
    </header>

    <main class="app-main">
      <div class="alert-section">
        <AlertPanel />
      </div>

      <div class="workspace">
        <div class="sidebar">
          <div class="sidebar-header">
            <div class="search-bar">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索申请编号、船名、港口..."
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="filter-bar">
              <el-select
                :model-value="suppliesStore.filterStatus"
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
            <div class="action-bar" v-if="userStore.hasPermission('batch_review')">
              <el-button type="primary" @click="openBatchReview">
                <el-icon><ListCheck /></el-icon>
                批量复核
              </el-button>
            </div>
          </div>
          <ApplicationList />
        </div>

        <div class="main-content">
          <ApplicationDetail />
        </div>
      </div>
    </main>

    <BatchReviewPanel ref="batchReviewRef" />
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      searchKeyword: ''
    }
  }
}
</script>

<style scoped lang="scss">
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
}

.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
}

.alert-section {
  flex-shrink: 0;
}

.workspace {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

.sidebar {
  width: 420px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .search-bar {
      :deep(.el-input__wrapper) {
        border-radius: 6px;
      }
    }

    .action-bar {
      display: flex;
      justify-content: flex-end;
    }
  }
}

.main-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}
</style>
