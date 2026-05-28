<script setup lang="ts">import { ref, computed } from 'vue';
import { useSuppliesStore } from '@/stores/supplies';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { mockSuppliers } from '@/data/mockData';
import type { SuppliesStatus } from '@/types';
const suppliesStore = useSuppliesStore();
const userStore = useUserStore();
const newComment = ref('');
const assignSupplierDialog = ref(false);
const selectedSupplier = ref('');
const rejectDialog = ref(false);
const rejectReason = ref('');
const statusLabels: Record<SuppliesStatus, string> = {
 draft: '草稿',
 pending_review: '待审核',
 reviewed: '已审核',
 rejected: '已驳回',
 supplier_assigned: '供应商已分配',
 in_progress: '执行中',
 completed: '已完成',
 paid: '已结算'
};
const categoryLabels: Record<string, string> = {
 provisions: '食品',
 engine: '机舱',
 deck: '甲板',
 medical: '医疗',
 documents: '文件',
 other: '其他'
};
const paymentStatusLabels = {
 unpaid: '未付',
 partial: '部分支付',
 paid: '已结清'
};
const paymentStatusColors = {
 unpaid: 'danger',
 partial: 'warning',
 paid: 'success'
};
const application = computed(() => suppliesStore.selectedApplication);
const hasCriticalItem = computed(() => {
 return application.value?.items.some(i => i.urgency === 'critical') ?? false;
});
const submitComment = () => {
 if (!newComment.value.trim() || !application.value)
 return;
 suppliesStore.addComment(application.value.id, newComment.value);
 newComment.value = '';
 ElMessage.success('备注已添加');
};
const approve = () => {
 if (!application.value)
 return;
 suppliesStore.updateStatus(application.value.id, 'reviewed', '审核通过');
 suppliesStore.addComment(application.value.id, '审核通过', 'system');
 ElMessage.success('已通过审核');
};
const openRejectDialog = () => {
 rejectDialog.value = true;
 rejectReason.value = '';
};
const confirmReject = () => {
 if (!application.value || !rejectReason.value.trim()) {
 ElMessage.warning('请填写驳回原因');
 return;
 }
 suppliesStore.updateStatus(application.value.id, 'rejected', rejectReason.value);
 suppliesStore.addComment(application.value.id, rejectReason.value, 'reject');
 rejectDialog.value = false;
 ElMessage.success('已驳回申请');
};
const openAssignSupplier = () => {
 assignSupplierDialog.value = true;
 selectedSupplier.value = application.value?.supplierId || '';
};
const confirmAssignSupplier = () => {
 if (!application.value || !selectedSupplier.value) {
 ElMessage.warning('请选择供应商');
 return;
 }
 const supplier = mockSuppliers.find(s => s.id === selectedSupplier.value);
 if (supplier) {
 suppliesStore.assignSupplier(application.value.id, supplier.id, supplier.name);
 suppliesStore.addComment(application.value.id, `已分配供应商: ${supplier.name}`, 'system');
 }
 assignSupplierDialog.value = false;
 ElMessage.success('供应商已分配');
};
const markInProgress = () => {
 if (!application.value)
 return;
 suppliesStore.updateStatus(application.value.id, 'in_progress', '开始执行');
 suppliesStore.addComment(application.value.id, '已开始执行补给任务', 'system');
 ElMessage.success('已开始执行');
};
const markCompleted = () => {
 if (!application.value)
 return;
 suppliesStore.updateStatus(application.value.id, 'completed', '补给完成');
 suppliesStore.addComment(application.value.id, '补给任务已完成', 'system');
 ElMessage.success('已标记完成');
};
const markPaid = () => {
 if (!application.value)
 return;
 ElMessageBox.confirm('确认该申请款项已全部结清？', '确认', {
 confirmButtonText: '确定',
 cancelButtonText: '取消',
 type: 'warning'
 }).then(() => {
 suppliesStore.updateStatus(application.value!.id, 'paid', '款项已结清');
 suppliesStore.addComment(application.value!.id, '款项已结清，流程结束', 'system');
 ElMessage.success('已标记已结算');
 }).catch(() => { });
};
const resubmit = () => {
 if (!application.value)
 return;
 suppliesStore.updateStatus(application.value.id, 'pending_review', '重新提交审核');
 suppliesStore.addComment(application.value.id, '已重新提交审核', 'system');
 ElMessage.success('已重新提交');
};
</script>

<template>
  <div class="application-detail" v-if="application">
    <div class="detail-header">
      <div class="header-left">
        <h2>
          {{ application.vesselName }}
          <span v-if="hasCriticalItem" class="critical-tag">特急</span>
        </h2>
        <p class="subtitle">{{ application.applicationNo }} · {{ application.port }}</p>
      </div>
      <div class="header-right">
        <el-tag size="large" type="primary">{{ statusLabels[application.status] }}</el-tag>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <div class="info-section">
          <h4>船舶与港口信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="船名">{{ application.vesselName }}</el-descriptions-item>
            <el-descriptions-item label="港口">{{ application.port }}</el-descriptions-item>
            <el-descriptions-item label="靠泊日期">{{ application.berthDate }}</el-descriptions-item>
            <el-descriptions-item label="离港日期">{{ application.departureDate }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ application.applicantName }}</el-descriptions-item>
            <el-descriptions-item label="当前处理人">{{ application.currentHandlerName || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="info-section">
          <h4>补给物资清单</h4>
          <el-table :data="application.items" size="small" border>
            <el-table-column prop="name" label="物品名称" />
            <el-table-column prop="category" label="分类">
              <template #default="{ row }">{{ categoryLabels[row.category] }}</template>
            </el-table-column>
            <el-table-column prop="specification" label="规格" />
            <el-table-column prop="quantity" label="数量" align="center">
              <template #default="{ row }">{{ row.quantity }}{{ row.unit }}</template>
            </el-table-column>
            <el-table-column prop="urgency" label="紧急度" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.urgency === 'critical'" type="danger" size="small">特急</el-tag>
                <el-tag v-else-if="row.urgency === 'urgent'" type="warning" size="small">紧急</el-tag>
                <span v-else>普通</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="info-section">
          <h4>供应商信息</h4>
          <div v-if="application.supplierName" class="supplier-info">
            <el-tag type="success">{{ application.supplierName }}</el-tag>
          </div>
          <div v-else class="no-supplier">
            <el-empty description="暂未分配供应商" :image-size="80" />
          </div>
        </div>

        <div class="info-section">
          <h4>费用信息</h4>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="总金额">
              <span class="amount-text">¥{{ application.totalAmount.toLocaleString() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="预付款">
              ¥{{ application.advancePayment.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="付款状态">
              <el-tag :type="paymentStatusColors[application.paymentStatus]" size="small">
                {{ paymentStatusLabels[application.paymentStatus] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="实际支付" v-if="application.actualPayment">
              ¥{{ application.actualPayment.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="付款截止日" v-if="application.paymentDueDate">
              <span :class="{ 'text-red-500': isPaymentNearDue(application.paymentDueDate) }">
                {{ application.paymentDueDate }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="证件管理" name="documents">
        <div class="info-section">
          <h4>证件截点跟踪</h4>
          <el-table :data="application.documents" size="small" border>
            <el-table-column prop="name" label="证件名称" />
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="deadline" label="截止日期" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-red-500 font-bold': isDocumentUrgent(row) }">
                  {{ row.deadline }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'received'" type="success" size="small">已收到</el-tag>
                <el-tag v-else-if="row.status === 'expired'" type="danger" size="small">已过期</el-tag>
                <el-tag v-else type="warning" size="small">待收取</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="提醒" align="center">
              <template #default="{ row }">
                <span v-for="day in row.reminderDays" :key="day" class="reminder-day">
                  T-{{ day }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="状态追踪" name="timeline">
        <div class="timeline-section">
          <el-timeline>
            <el-timeline-item
              v-for="history in application.statusHistory.slice().reverse()"
              :key="history.id"
              :timestamp="history.timestamp"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-status">{{ statusLabels[history.status] }}</div>
                <div class="timeline-operator">{{ history.userName }}</div>
                <div v-if="history.remark" class="timeline-remark">{{ history.remark }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-tab-pane>

      <el-tab-pane label="沟通记录" name="comments">
        <div class="comments-section">
          <div class="comment-list">
            <div
              v-for="comment in application.comments"
              :key="comment.id"
              class="comment-item"
              :class="comment.type"
            >
              <div class="comment-header">
                <span class="comment-user">{{ comment.userName }}</span>
                <span class="comment-role">({{ userStore.roleLabels[comment.userRole] }})</span>
                <span class="comment-time">{{ comment.timestamp }}</span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
            </div>
          </div>
          <div class="comment-input">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="输入备注或沟通内容..."
            />
            <el-button type="primary" style="margin-top: 8px" @click="submitComment">
              添加备注
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="action-bar">
      <template v-if="application.status === 'pending_review' && userStore.hasPermission('review')">
        <el-button type="primary" @click="approve">审核通过</el-button>
        <el-button type="danger" @click="openRejectDialog">驳回申请</el-button>
      </template>
      <template v-if="application.status === 'reviewed' && userStore.hasPermission('assign_supplier')">
        <el-button type="primary" @click="openAssignSupplier">分配供应商</el-button>
      </template>
      <template v-if="application.status === 'supplier_assigned'">
        <el-button type="primary" @click="markInProgress">开始执行</el-button>
      </template>
      <template v-if="application.status === 'in_progress'">
        <el-button type="success" @click="markCompleted">标记完成</el-button>
      </template>
      <template v-if="application.status === 'completed' && userStore.hasPermission('approve_payment')">
        <el-button type="success" @click="markPaid">确认结清</el-button>
      </template>
      <template v-if="application.status === 'rejected'">
        <el-button type="primary" @click="resubmit">重新提交</el-button>
      </template>
      <el-button @click="suppliesStore.selectApplication(null)">关闭</el-button>
    </div>

    <el-dialog v-model="rejectDialog" title="驳回申请" width="500px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请填写驳回原因..."
      />
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignSupplierDialog" title="分配供应商" width="600px">
      <el-table
        :data="mockSuppliers"
        @selection-change="(sel) => selectedSupplier = sel[0]?.id || ''"
        size="small"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="供应商名称" />
        <el-table-column prop="contact" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="rating" label="评分" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="assignSupplierDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignSupplier">确认分配</el-button>
      </template>
    </el-dialog>
  </div>

  <div v-else class="detail-empty">
    <el-empty description="请选择一个申请查看详情" :image-size="120" />
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      activeTab: 'basic'
    }
  },
  methods: {
    isPaymentNearDue(dueDate?: string) {
      if (!dueDate) return false
      const today = new Date()
      const due = new Date(dueDate)
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diff <= 3
    },
    isDocumentUrgent(doc: { deadline: string; status: string }) {
      if (doc.status === 'received') return false
      const today = new Date()
      const deadline = new Date(doc.deadline)
      const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diff <= 3
    }
  }
}
</script>

<style scoped lang="scss">
.application-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;

  .header-left {
    h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }

    .critical-tag {
      background: #f56c6c;
      color: #fff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  }
}

.detail-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }
}

.info-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: #303133;
    font-weight: 600;
  }
}

.amount-text {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.supplier-info {
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #b3d8ff;
}

.no-supplier {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.timeline-section {
  padding: 20px 0;
}

.timeline-content {
  .timeline-status {
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }

  .timeline-operator {
    color: #606266;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .timeline-remark {
    color: #909399;
    font-size: 13px;
  }
}

.comments-section {
  .comment-list {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .comment-item {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 12px;
    border-left: 3px solid #dcdfe6;

    &.reject {
      border-left-color: #f56c6c;
      background: #fef0f0;
    }

    &.reminder {
      border-left-color: #e6a23c;
      background: #fdf6ec;
    }

    &.system {
      border-left-color: #909399;
      background: #f4f4f5;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .comment-user {
        font-weight: 600;
        color: #303133;
      }

      .comment-role {
        color: #909399;
        font-size: 12px;
      }

      .comment-time {
        margin-left: auto;
        color: #c0c4cc;
        font-size: 12px;
      }
    }

    .comment-content {
      color: #606266;
      line-height: 1.5;
    }
  }
}

.action-bar {
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fff;
}

.reminder-day {
  display: inline-block;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
}

.text-red-500 {
  color: #f56c6c;
}

.font-bold {
  font-weight: 600;
}
</style>
