<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore, statusLabel } from "@/store/app";
import { History, Search } from "lucide-vue-next";
import { useEvidence } from "@/composables/useEvidence";

const store = useAppStore();
const { timelineFor } = useEvidence();

const selectedId = ref<string>("o1");
const search = ref("");
const order = computed(() => store.orderById(selectedId.value));
const items = computed(() => timelineFor(selectedId.value));

const filteredOrders = computed(() => {
  const q = search.value.trim();
  if (!q) return store.orders.value;
  return store.orders.value.filter((o) => {
    const c = store.customerOf(o);
    return (
      o.code.includes(q) ||
      (c?.name ?? "").includes(q) ||
      (c?.phone ?? "").includes(q)
    );
  });
});

function selectOrder(id: string) {
  selectedId.value = id;
}
</script>

<template>
  <div class="p-6 grid grid-cols-[280px_minmax(0,1fr)] gap-5 h-full">
    <aside class="card-soft p-3 flex flex-col gap-2 overflow-auto">
      <div class="relative">
        <Search
          class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-paper/40"
        />
        <input
          v-model="search"
          class="input pl-8"
          placeholder="搜索订单号 / 顾客"
        />
      </div>
      <div class="px-2 py-1 mono text-paper/60">订单历史</div>
      <button
        v-for="o in filteredOrders"
        :key="o.id"
        class="text-left rounded-lg px-3 py-2 transition"
        :class="
          selectedId === o.id
            ? 'bg-moss-500/15 ring-1 ring-moss-500/40'
            : 'hover:bg-white/5'
        "
        @click="selectOrder(o.id)"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm text-paper/90 truncate">{{ o.code }}</div>
          <span class="tag border-white/10 text-paper/70">{{
            statusLabel[o.status]
          }}</span>
        </div>
        <div class="mono truncate">
          {{ store.customerOf(o)?.name }} · {{ o.createdAt }}
        </div>
      </button>
    </aside>

    <section class="flex flex-col gap-4 min-w-0">
      <div v-if="order" class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <History class="w-5 h-5 text-moss-500" />
          <div class="section-title">全链路时间线</div>
          <div class="ml-auto mono">
            {{ order.code }} · {{ store.customerOf(order)?.name }}
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div class="card-soft p-3">
            <div class="mono">套餐</div>
            <div class="mt-1">{{ store.pkgOf(order)?.name }}</div>
            <div class="mono mt-1">¥{{ store.pkgOf(order)?.price }}</div>
          </div>
          <div class="card-soft p-3">
            <div class="mono">门店</div>
            <div class="mt-1">{{ order.store }}</div>
            <div class="mono mt-1">销售：{{ order.salesperson }}</div>
          </div>
          <div class="card-soft p-3">
            <div class="mono">状态</div>
            <div class="mt-1">
              <span class="tag border-white/10">{{
                statusLabel[order.status]
              }}</span>
            </div>
            <div class="mono mt-1">创建 {{ order.createdAt }}</div>
          </div>
        </div>

        <ol class="relative mt-5">
          <div
            class="absolute left-[7px] top-1 bottom-1 w-px bg-white/10"
          ></div>
          <li
            v-for="(it, idx) in items"
            :key="it.id"
            class="relative pl-6 pb-4 last:pb-0"
          >
            <div
              class="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full"
              :class="{
                'bg-moss-500/90': it.color === 'moss',
                'bg-amber2-500/90': it.color === 'amber',
                'bg-rose-500/80': it.color === 'rose',
                'bg-sky-500/80': it.color === 'sky',
                'bg-violet-500/80': it.color === 'violet',
                'bg-slate-400/80': it.color === 'slate',
              }"
            ></div>
            <div class="flex items-baseline gap-2">
              <div class="mono">{{ it.time }}</div>
              <div class="text-[12px] text-paper/60">{{ it.title }}</div>
            </div>
            <div class="text-sm text-paper/85 leading-relaxed">
              {{ it.desc }}
            </div>
            <div v-if="it.actor" class="mono mt-0.5">
              操作人：{{ it.actor }}
            </div>
          </li>
          <li v-if="items.length === 0" class="text-sm text-paper/50">
            暂无记录
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>
