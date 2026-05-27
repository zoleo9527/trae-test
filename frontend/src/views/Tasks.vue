<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { taskApi } from '@/api';
import { TaskStatus, TaskType, UserRole } from '@/types';
import type { Task } from '@/types';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const taskBoard = ref<any>(null);
const loading = ref(true);
const resultNote = ref('');
const showCompleteModal = ref(false);
const selectedTask = ref<Task | null>(null);

const loadTasks = async () => {
  loading.value = true;
  try {
    if (userStore.currentRole === UserRole.OPERATION_MANAGER) {
      const res = await taskApi.getBoard();
      taskBoard.value = res.data;
    } else {
      const res = await taskApi.getMyTasks(userStore.currentRole, userStore.currentUser.id);
      taskBoard.value = {
        pending: res.data.filter((t: Task) => t.status === TaskStatus.PENDING),
        inProgress: res.data.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS),
        completed: [],
        unassigned: [],
      };
    }
  } finally {
    loading.value = false;
  }
};

const taskTypeLabels: Record<TaskType, string> = {
  [TaskType.VERIFICATION_DISPUTE]: '核销争议',
  [TaskType.REFUND_REVIEW]: '退款核验',
  [TaskType.STATION_INSPECTION]: '站点巡检',
  [TaskType.SUPPLY_REPLENISHMENT]: '耗材补货',
};

const taskTypeColors: Record<TaskType, string> = {
  [TaskType.VERIFICATION_DISPUTE]: 'badge-info',
  [TaskType.REFUND_REVIEW]: 'badge-warning',
  [TaskType.STATION_INSPECTION]: 'badge-danger',
  [TaskType.SUPPLY_REPLENISHMENT]: 'badge-success',
};

const priorityLabels = ['低', '中', '高'];

const assignTask = async (task: Task) => {
  await taskApi.assign(task.id, userStore.currentUser.id);
  await loadTasks();
};

const startTask = async (task: Task) => {
  await taskApi.start(task.id, userStore.currentUser.id);
  await loadTasks();
};

const openCompleteModal = (task: Task) => {
  selectedTask.value = task;
  resultNote.value = '';
  showCompleteModal.value = true;
};

const completeTask = async () => {
  if (!selectedTask.value || !resultNote.value) return;
  await taskApi.complete(selectedTask.value.id, resultNote.value);
  showCompleteModal.value = false;
  await loadTasks();
};

watch(() => userStore.currentRole, () => {
  loadTasks();
});

onMounted(() => {
  loadTasks();
});

const columns = [
  { key: 'unassigned', label: '待分配', color: 'gray' },
  { key: 'pending', label: '待处理', color: 'warning' },
  { key: 'inProgress', label: '处理中', color: 'info' },
  { key: 'completed', label: '已完成', color: 'success' },
];
</script>

<template>
  <div>
    <div class="card mb-4">
      <div class="card-body flex items-center justify-between">
        <div class="text-sm text-gray-500">
          按角色过滤后显示相关任务，运营主管可查看全部任务看板
        </div>
        <button class="btn btn-outline" @click="loadTasks">刷新</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-500">加载中...</div>

    <div v-else class="grid gap-4" style="grid-template-columns: repeat(4, 1fr)">
      <div
        v-for="col in columns"
        :key="col.key"
        class="card"
      >
        <div class="card-header flex items-center justify-between">
          <span>{{ col.label }}</span>
          <span class="badge" :class="'badge-' + col.color">
            {{ taskBoard?.[col.key]?.length || 0 }}
          </span>
        </div>
        <div class="card-body space-y-3 min-h-96">
          <div
            v-for="task in taskBoard?.[col.key]"
            :key="task.id"
            class="p-3 border rounded-lg hover:border-primary transition-colors bg-white"
          >
            <div class="flex items-start justify-between mb-2">
              <span class="badge text-xs" :class="taskTypeColors[task.type]">
                {{ taskTypeLabels[task.type] }}
              </span>
              <span 
                v-if="task.escalated"
                class="badge badge-danger text-xs"
              >
                紧急
              </span>
            </div>
            
            <div class="font-medium text-sm mb-1">{{ task.title }}</div>
            <div class="text-xs text-gray-500 mb-2 line-clamp-2">
              {{ task.description }}
            </div>

            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-500">📍 {{ task.station.name }}</span>
              <span class="text-gray-400">优先级: {{ priorityLabels[task.priority - 1] }}</span>
            </div>

            <div v-if="task.assignee" class="mt-2 text-xs text-gray-500">
              负责人: {{ task.assignee.name }}
            </div>

            <div class="mt-3 flex gap-2">
              <button
                v-if="col.key === 'unassigned' && userStore.currentRole === UserRole.OPERATION_MANAGER"
                class="btn btn-primary text-xs flex-1"
                @click="assignTask(task)"
              >
                分配给我
              </button>
              <button
                v-if="col.key === 'pending'"
                class="btn btn-primary text-xs flex-1"
                @click="startTask(task)"
              >
                开始
              </button>
              <button
                v-if="col.key === 'inProgress'"
                class="btn btn-success text-xs flex-1"
                @click="openCompleteModal(task)"
              >
                完成
              </button>
            </div>
          </div>

          <div v-if="!taskBoard?.[col.key]?.length" class="text-center py-8 text-gray-400 text-sm">
            暂无任务
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCompleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-4 border-b flex items-center justify-between">
          <span class="font-semibold">完成任务</span>
          <button @click="showCompleteModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div class="p-4">
          <div class="mb-4">
            <div class="font-medium mb-1">{{ selectedTask?.title }}</div>
            <div class="text-sm text-gray-500">{{ selectedTask?.station.name }}</div>
          </div>
          <div class="mb-4">
            <label class="text-sm text-gray-500 mb-1 block">处理结果</label>
            <textarea 
              v-model="resultNote" 
              class="textarea"
              placeholder="请输入处理结果详情..."
            ></textarea>
          </div>
          <button 
            class="btn btn-success w-full"
            :disabled="!resultNote"
            @click="completeTask"
          >
            确认完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
