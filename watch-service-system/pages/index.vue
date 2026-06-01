<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p class="mt-1 text-sm text-gray-500">
        欢迎回来，{{ userName }}（{{ currentRoleLabel }}）！这是今日的售后概览
      </p>
    </div>

    <LoadingState v-if="loadingStats" text="加载统计数据..." />

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="待处理工单"
          :value="stats?.pending || 0"
          icon="mdi:clipboard-clock"
          variant="warning"
          sub-text="需要您关注的工单"
          sub-icon="mdi:alert-circle"
          @click="navigateToWorkOrders('pending')"
        />
        <StatCard
          title="待审批报价"
          :value="stats?.needReview || 0"
          icon="mdi:file-document-edit"
          variant="info"
          sub-text="等待经理审批"
          sub-icon="mdi:clock-outline"
          @click="navigateToWorkOrders('approval')"
        />
        <StatCard
          title="已驳回工单"
          :value="stats?.rejected || 0"
          icon="mdi:close-circle"
          variant="danger"
          sub-text="需要重新处理"
          sub-icon="mdi:refresh"
          @click="navigateToWorkOrders('rejected')"
        />
        <StatCard
          title="今日新增"
          :value="stats?.todayNew || 0"
          icon="mdi:plus-circle"
          variant="success"
          :sub-text="`本周完成: ${stats?.completedThisWeek || 0}`"
          sub-icon="mdi:check"
          @click="navigateToWorkOrders"
        />
      </div>

      <div v-if="stats?.needFollowUp && stats.needFollowUp > 0" class="mb-8">
        <div class="card p-4 bg-amber-50 border-amber-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500">
                <Icon icon="mdi:bell-ring" class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="font-medium text-amber-900">待回访提醒</p>
                <p class="text-sm text-amber-700">
                  有 {{ stats.needFollowUp }} 个已取件工单需要进行满意度回访
                </p>
              </div>
            </div>
            <button
              @click="navigateToWorkOrders('followup')"
              class="btn-primary btn-sm"
            >
              立即处理
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2">
          <TaskList
            title="我的待办任务"
            :orders="myTasks"
            :show-role-badge="true"
            empty-title="暂无待办任务"
            empty-desc="您当前没有需要处理的任务"
            @select="handleSelectOrder"
          />
        </div>

        <div class="space-y-6">
          <div class="card p-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">快捷操作</h3>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-if="currentRole === 'consultant'"
                @click="showCreateModal = true"
                class="flex flex-col items-center p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-primary-500 mb-2">
                  <Icon icon="mdi:plus" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-primary-700">新建工单</span>
              </button>
              <button
                v-if="currentRole === 'manager'"
                @click="navigateToWorkOrders('approval')"
                class="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 mb-2">
                  <Icon icon="mdi:check-decagram" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-blue-700">审批报价</span>
              </button>
              <button
                v-if="currentRole === 'technician'"
                @click="navigateToWorkOrders('ready_for_repair')"
                class="flex flex-col items-center p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 mb-2">
                  <Icon icon="mdi:play-circle" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-indigo-700">待开始</span>
              </button>
              <button
                v-if="currentRole === 'technician'"
                @click="navigateToWorkOrders('repairing')"
                class="flex flex-col items-center p-4 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500 mb-2">
                  <Icon icon="mdi:hammer-wrench" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-cyan-700">维修中</span>
              </button>
              <button
                v-if="currentRole === 'consultant'"
                @click="navigateToWorkOrders('pending_confirm')"
                class="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 mb-2">
                  <Icon icon="mdi:message-text" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-purple-700">待确认</span>
              </button>
              <button
                v-if="currentRole === 'manager'"
                @click="navigateToWorkOrders('followup')"
                class="flex flex-col items-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500 mb-2">
                  <Icon icon="mdi:star" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-yellow-700">满意度回访</span>
              </button>
              <button
                v-if="currentRole === 'consultant'"
                @click="navigateToWorkOrders('ready_for_pickup')"
                class="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 mb-2">
                  <Icon icon="mdi:package-variant-closed" class="w-5 h-5 text-white" />
                </div>
                <span class="text-sm font-medium text-green-700">待取件</span>
              </button>
            </div>
          </div>

          <TaskList
            title="待审批工单"
            :orders="needReviewOrders"
            empty-title="暂无待审批"
            empty-desc="所有报价都已处理完毕"
            @select="handleSelectOrder"
          />

          <TaskList
            title="已驳回需回查"
            :orders="rejectedOrders"
            empty-title="暂无驳回工单"
            empty-desc="没有需要重新处理的工单"
            @select="handleSelectOrder"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">本周效率</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">本周完成工单</span>
              <span class="text-2xl font-bold text-gray-900">{{ stats?.completedThisWeek || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">平均处理周期</span>
              <span class="text-2xl font-bold text-gray-900">{{ stats?.avgProcessTime || 0 }} <span class="text-sm font-normal text-gray-500">天</span></span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                :style="{ width: `${Math.min(100, ((stats?.completedThisWeek || 0) / 20) * 100)}%` }"
              />
            </div>
            <p class="text-xs text-gray-500">目标: 每周完成 20 单</p>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">状态分布</h3>
          <div class="space-y-3">
            <div
              v-for="item in statusDistribution"
              :key="item.status"
              class="flex items-center space-x-3"
            >
              <div
                class="w-3 h-3 rounded-full"
                :class="item.colorClass"
              />
              <span class="flex-1 text-sm text-gray-600">{{ item.label }}</span>
              <span class="text-sm font-medium text-gray-900">{{ item.count }}</span>
              <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="item.colorClass"
                  :style="{ width: `${item.percentage}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    <CreateWorkOrderModal
      v-model="showCreateModal"
      :loading="createLoading"
      @submit="handleCreateWorkOrder"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { STATUS_GROUPS } from '~/utils/constants';

const router = useRouter();
const { userName, currentRole, currentRoleLabel } = useRole();
const {
  stats,
  loading,
  pendingOrders,
  rejectedOrders,
  needReviewOrders,
  myTasks,
  workOrders,
  fetchStats,
  fetchWorkOrders,
  fetchPartInventory,
  selectOrder,
  setFilter,
  createWorkOrder,
} = useWorkOrder();

const showCreateModal = ref(false);
const createLoading = ref(false);

const loadingStats = computed(() => loading.value && !stats.value);

const statusDistribution = computed(() => {
  const total = workOrders.value.length || 1;
  const statusMap = [
    { status: 'pending_review', label: '待检测', colorClass: 'bg-amber-500' },
    { status: 'quoting', label: '报价中', colorClass: 'bg-blue-500' },
    { status: 'pending_approval', label: '待审批', colorClass: 'bg-orange-500' },
    { status: 'rejected', label: '已驳回', colorClass: 'bg-red-500' },
    { status: 'pending_confirm', label: '待客户确认', colorClass: 'bg-purple-500' },
    { status: 'repairing', label: '维修中', colorClass: 'bg-cyan-500' },
    { status: 'completed', label: '已完成', colorClass: 'bg-green-500' },
    { status: 'picked_up', label: '已取件', colorClass: 'bg-gray-500' },
  ];

  return statusMap.map(item => ({
    ...item,
    count: workOrders.value.filter(wo => wo.status === item.status).length,
    percentage: Math.round((workOrders.value.filter(wo => wo.status === item.status).length / total) * 100),
  })).filter(item => item.count > 0);
});

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchWorkOrders(),
    fetchPartInventory(),
  ]);
});

function navigateToWorkOrders(tab?: string) {
  if (tab) {
    const statusFilter = STATUS_GROUPS[tab];
    if (statusFilter) {
      setFilter({ status: statusFilter as any });
    }
  }
  router.push('/workorders');
}

function handleSelectOrder(order: any) {
  selectOrder(order);
  router.push('/workorders');
}

async function handleCreateWorkOrder(data: any) {
  createLoading.value = true;
  try {
    const newOrder = await createWorkOrder(data);
    showCreateModal.value = false;
    selectOrder(newOrder);
    router.push('/workorders');
  } catch (err) {
    console.error('创建工单失败:', err);
  } finally {
    createLoading.value = false;
  }
}
</script>
