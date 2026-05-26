<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">会员储值</h1>
        <p class="text-sm text-gray-500 mt-1">
          储值与消课记录合并查看，避免错扣
        </p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div
        v-for="m in members"
        :key="m.id"
        class="card cursor-pointer hover:shadow-md transition-shadow"
        :class="selectedId === m.id ? 'ring-2 ring-brand-400' : ''"
        @click="selectMember(m.id)"
      >
        <div class="flex items-center justify-between">
          <div class="font-medium text-gray-800">{{ m.name }}</div>
          <span class="text-xs text-gray-400">{{ m.phone }}</span>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <div class="text-gray-500 text-xs">余额</div>
            <div class="font-semibold text-brand-700">
              ¥{{ m.balance.toFixed(2) }}
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-xs">总节数</div>
            <div class="font-semibold">{{ m.total_sessions }}</div>
          </div>
          <div>
            <div class="text-gray-500 text-xs">已用</div>
            <div class="font-semibold">{{ m.used_sessions }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedId" class="card">
      <div class="text-sm font-semibold text-gray-800 mb-3">
        {{ selected?.name }} 的储值记录
      </div>
      <ul class="divide-y divide-gray-100 text-sm">
        <li
          v-for="r in records"
          :key="r.id"
          class="py-2 flex items-center justify-between"
        >
          <div>
            <span
              :class="
                r.type === 'consume'
                  ? 'text-rose-600'
                  : r.type === 'refund'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
              "
              class="font-medium"
            >
              {{
                r.type === "recharge"
                  ? "充值"
                  : r.type === "consume"
                    ? "消费"
                    : "退款"
              }}
            </span>
            <span v-if="r.note" class="text-xs text-gray-500 ml-2">{{
              r.note
            }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-medium">¥{{ r.amount.toFixed(2) }}</span>
            <span class="text-xs text-gray-400">{{
              formatTime(r.created_at)
            }}</span>
          </div>
        </li>
        <li v-if="records.length === 0" class="py-4 text-center text-gray-400">
          暂无记录
        </li>
      </ul>
    </div>
    <div v-else class="card text-sm text-gray-400 text-center">
      点击左侧会员查看储值流水
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Member, StoredValueRecord } from "~/types";

const { data: members } = await useApi<Member[]>("/members");
const selectedId = ref<string | null>(null);
const records = ref<StoredValueRecord[]>([]);
const selected = computed(() =>
  members.value?.find((m) => m.id === selectedId.value),
);

async function selectMember(id: string) {
  selectedId.value = id;
  try {
    const cfg = useRuntimeConfig();
    records.value = await $fetch<StoredValueRecord[]>(
      `/members/${id}/stored-value`,
      {
        baseURL: cfg.public.apiBase,
      },
    );
  } catch {
    records.value = [];
  }
}

function formatTime(t: string) {
  return new Date(t).toLocaleString("zh-CN");
}
</script>
