<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useSuppliesStore } from '@/stores/supplies'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SuppliesApplication } from '@/types'

const suppliesStore = useSuppliesStore()

const batchReviewVisible = ref(false)
const selectedIds = ref<string[]>([])
const batchRejectReason = ref('')
const reviewMode = ref<'approve' | 'reject' | null>(null)
const tableRef = ref()
const isAllSelected = ref(false)
const isIndeterminate = ref(false)

const pendingApplications = computed(() => {
  return suppliesStore.applications.filter(app => app.status === 'pending_review')
})

const updateSelectionState = () => {
  const total = pendingApplications.value.length
  const selected = selectedIds.value.length
  isAllSelected.value = total > 0 && selected === total
  isIndeterminate.value = selected > 0 && selected < total
}

const handleSelectionChange = (selection: SuppliesApplication[]) => {
  selectedIds.value = selection.map(s => s.id)
  updateSelectionState()
}

const handleSelectAll = (checked: boolean) => {
  nextTick(() => {
    if (tableRef.value) {
      tableRef.value.clearSelection()
      if (checked) {
        pendingApplications.value.forEach((row, index) => {
          tableRef.value.toggleRowSelection(row, true)
        })
      }
    }
  })
}

const openBatchReview = () => {
  batchReviewVisible.value = true
  selectedIds.value = []
  reviewMode.value = null
  batchRejectReason.value = ''
  isAllSelected.value = false
  isIndeterminate.value = false
}

const confirmBatchApprove = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一个申请')
    return
  }
  ElMessageBox.confirm(
    `确认批量通过 ${selectedIds.value.length} 条申请？`,
    '批量审核',
    { type: 'warning' }
  ).then(() => {
    suppliesStore.batchReview(selectedIds.value, true)
    ElMessage.success(`已批量通过 ${selectedIds.value.length} 条申请`)
    batchReviewVisible.value = false
    selectedIds.value = []
  }).catch(() => {})
}

const confirmBatchReject = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一个申请')
    return
  }
  if (!batchRejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  ElMessageBox.confirm(
    `确认批量驳回 ${selectedIds.value.length} 条申请？`,
    '批量审核',
    { type: 'warning' }
  ).then(() => {
    suppliesStore.batchReview(selectedIds.value, false, batchRejectReason.value)
    ElMessage.success(`已批量驳回 ${selectedIds.value.length} 条申请`)
    batchReviewVisible.value = false
    selectedIds.value = []
    batchRejectReason.value = ''
  }).catch(() => {})
}

watch(batchReviewVisible, (val) => {
  if (val) {
    nextTick(() => {
      if (tableRef.value) {
        tableRef.value.clearSelection()
      }
    })
  }
})

defineExpose({ openBatchReview })
</script>

<template>
  <el-dialog
    v-model="batchReviewVisible"
    title="批量复核"
    width="900px"
    class="batch-review-dialog"
  >
    <div class="batch-review-header">
      <div class="stats">
        待审核: <span class="count">{{ pendingApplications.length }}</span> 条
      </div>
      <el-checkbox 
        v-model="isAllSelected" 
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >
        全选
      </el-checkbox>
    </div>

    <div class="application-table">
      <el-table
        ref="tableRef"
        :data="pendingApplications"
        @selection-change="handleSelectionChange"
        size="small"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="applicationNo" label="申请编号" width="140" />
        <el-table-column prop="vesselName" label="船名" width="120" />
        <el-table-column prop="port" label="港口" width="100" />
        <el-table-column prop="berthDate" label="靠泊日期" width="120" />
        <el-table-column label="物资摘要">
          <template #default="{ row }">
            <div class="items-summary">
              <span v-for="item in row.items.slice(0, 3)" :key="item.id" class="item-chip">
                {{ item.name }}
              </span>
              <span v-if="row.items.length > 3">+{{ row.items.length - 3 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.totalAmount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="applicantName" label="申请人" width="100" />
      </el-table>
    </div>

    <div v-if="reviewMode === 'reject'" class="reject-reason-section">
      <el-input
        v-model="batchRejectReason"
        type="textarea"
        :rows="3"
        placeholder="请填写统一驳回原因..."
      />
    </div>

    <template #footer>
      <div class="footer-actions">
        <span class="selected-info">已选择 {{ selectedIds.length }} 条</span>
        <div class="action-buttons">
          <el-button @click="batchReviewVisible = false">取消</el-button>
          <el-button v-if="reviewMode !== 'reject'" type="primary" @click="reviewMode = 'reject'">
            批量驳回
          </el-button>
          <template v-if="reviewMode === 'reject'">
            <el-button @click="reviewMode = null">返回</el-button>
            <el-button type="danger" @click="confirmBatchReject">
              确认驳回
            </el-button>
          </template>
          <el-button
            v-if="reviewMode !== 'reject'"
            type="success"
            :disabled="selectedIds.length === 0"
            @click="confirmBatchApprove"
          >
            批量通过
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.batch-review-dialog {
  :deep(.el-dialog__body) {
    padding-top: 0;
  }
}

.batch-review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;

  .stats {
    color: #606266;

    .count {
      color: #f56c6c;
      font-weight: 600;
      font-size: 18px;
    }
  }
}

.application-table {
  max-height: 400px;
  overflow-y: auto;
}

.items-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .item-chip {
    background: #f5f7fa;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #606266;
  }
}

.reject-reason-section {
  margin-top: 16px;
  padding: 16px;
  background: #fef0f0;
  border-radius: 8px;
  border: 1px solid #fbc4c4;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .selected-info {
    color: #909399;
    font-size: 14px;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }
}
</style>
