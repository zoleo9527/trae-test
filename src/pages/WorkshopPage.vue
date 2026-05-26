<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore, statusLabel } from "@/store/app";
import {
  Factory,
  PackageCheck,
  Truck,
  Wrench,
  AlertTriangle,
  Plus,
  Save,
} from "lucide-vue-next";
import EvidenceTimeline from "@/components/EvidenceTimeline.vue";

const store = useAppStore();
const selectedId = ref<string>("o1");
const order = computed(() => store.orderById(selectedId.value));
const customer = computed(() =>
  order.value ? store.customerOf(order.value) : undefined,
);
const job = computed(() =>
  order.value ? store.jobOf(order.value.id) : undefined,
);
const transfers = computed(() =>
  order.value ? store.transfersOf(order.value.id) : [],
);
const repairs = computed(() =>
  order.value ? store.repairsOf(order.value.id) : [],
);

const stages = [
  { key: "pending", label: "待加工" },
  { key: "cutting", label: "割片" },
  { key: "edging", label: "磨边" },
  { key: "quality", label: "质检" },
  { key: "done", label: "完成" },
] as const;

function stageIndex(s: string) {
  return stages.findIndex((x) => x.key === s);
}

function selectOrder(id: string) {
  selectedId.value = id;
}

const newTransfer = ref({
  fromStore: "",
  toStore: "",
  logistics: "",
  trackingNo: "",
});

function registerTransfer() {
  if (!order.value) return;
  const t = {
    id: "t" + (store.db.transfers.length + 1),
    orderId: order.value.id,
    fromStore: newTransfer.value.fromStore || "仓库",
    toStore: newTransfer.value.toStore || "中央加工中心",
    logistics: newTransfer.value.logistics || "顺丰速运",
    trackingNo:
      newTransfer.value.trackingNo ||
      "SF" + Math.floor(100000 + Math.random() * 900000),
    status: "sent" as const,
    sentAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    lost: false,
  };
  store.db.transfers.push(t);
  store.addNote({
    orderId: order.value.id,
    kind: "evidence",
    role: "workshop",
    actor: store.currentActor?.name ?? "加工",
    content: `登记镜片调拨：${t.fromStore} → ${t.toStore}，${t.logistics} ${t.trackingNo}`,
  });
  newTransfer.value = {
    fromStore: "",
    toStore: "",
    logistics: "",
    trackingNo: "",
  };
}

function markLost(id: string) {
  store.markTransferLost(id);
  const t = store.db.transfers.find((x) => x.id === id);
  if (t && order.value) {
    store.addNote({
      orderId: order.value.id,
      kind: "evidence",
      role: "workshop",
      actor: store.currentActor?.name ?? "加工",
      content: `确认调拨丢失：${t.logistics} ${t.trackingNo}，已同步仓库与售后。`,
    });
  }
}
</script>

<template>
  <div class="p-6 grid grid-cols-[220px_minmax(0,1fr)_360px] gap-5 h-full">
    <aside class="card-soft p-3 flex flex-col gap-2 overflow-auto">
      <div class="px-2 py-1 mono text-paper/60">在制订单</div>
      <button
        v-for="o in store.orders.value.filter(
          (x) => x.status !== 'delivered' && x.status !== 'refunded',
        )"
        :key="o.id"
        class="text-left rounded-lg px-3 py-2 transition"
        :class="
          selectedId === o.id
            ? 'bg-moss-500/15 ring-1 ring-moss-500/40'
            : 'hover:bg-white/5'
        "
        @click="selectOrder(o.id)"
      >
        <div class="text-sm text-paper/90 truncate">{{ o.code }}</div>
        <div class="mono truncate">{{ store.customerOf(o)?.name }}</div>
        <div class="mt-1">
          <span class="tag border-white/10 text-paper/70">{{
            statusLabel[o.status]
          }}</span>
        </div>
      </button>
    </aside>

    <section class="flex flex-col gap-4 min-w-0">
      <div v-if="order" class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <Factory class="w-5 h-5 text-amber2-500" />
          <div class="section-title">加工进度</div>
          <div class="ml-auto mono">
            {{ order.code }} · {{ customer?.name }}
          </div>
        </div>
        <div v-if="job" class="relative">
          <div class="grid grid-cols-5 gap-2">
            <div
              v-for="(s, i) in stages"
              :key="s.key"
              class="relative rounded-xl border p-3 text-sm transition"
              :class="
                i <= stageIndex(job.stage)
                  ? 'border-moss-500/50 bg-moss-500/10'
                  : 'border-white/10 bg-ink-800/40'
              "
            >
              <div class="mono">{{ i + 1 }}</div>
              <div class="mt-1 text-paper/90">{{ s.label }}</div>
              <div
                v-if="i === stageIndex(job.stage)"
                class="mono mt-1 text-moss-500"
              >
                进行中
              </div>
            </div>
          </div>
          <div
            class="absolute left-6 right-6 top-[22px] h-px bg-white/10"
          ></div>
          <div class="mt-3 mono">
            跟单：{{ job.assignee }} · 最近更新 {{ job.updatedAt }}
          </div>
        </div>
        <div v-else class="text-sm text-paper/50">该订单尚未进入加工队列</div>
      </div>

      <div v-if="order" class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <Truck class="w-4 h-4 text-sky-400" />
          <div class="section-title">镜片调拨</div>
          <div class="ml-auto mono">{{ transfers.length }} 笔</div>
        </div>
        <ul class="space-y-2">
          <li
            v-for="t in transfers"
            :key="t.id"
            class="rounded-xl border p-3"
            :class="
              t.lost
                ? 'border-rose-500/40 bg-rose-500/10'
                : 'border-white/10 bg-ink-900/40'
            "
          >
            <div class="flex items-center gap-2">
              <AlertTriangle v-if="t.lost" class="w-4 h-4 text-rose-400" />
              <PackageCheck v-else class="w-4 h-4 text-sky-400" />
              <div class="text-sm text-paper/90">
                {{ t.fromStore }} → {{ t.toStore }}
              </div>
              <span class="tag border-white/10 text-paper/70">{{
                t.logistics
              }}</span>
              <span class="mono">{{ t.trackingNo }}</span>
              <span class="tag border-white/10 text-paper/70 ml-auto">{{
                t.status
              }}</span>
              <button v-if="!t.lost" class="btn-ghost" @click="markLost(t.id)">
                <AlertTriangle class="w-4 h-4 text-rose-400" /> 标记丢失
              </button>
            </div>
            <div v-if="t.note" class="mono mt-1 text-paper/60">
              {{ t.note }}
            </div>
          </li>
          <li v-if="transfers.length === 0" class="text-sm text-paper/50">
            暂无调拨记录
          </li>
        </ul>

        <div class="mt-4 card-soft p-3">
          <div class="mono mb-2 text-paper/60">登记新的调拨</div>
          <div class="grid grid-cols-4 gap-2">
            <input
              v-model="newTransfer.fromStore"
              class="input"
              placeholder="来源仓库"
            />
            <input
              v-model="newTransfer.toStore"
              class="input"
              placeholder="目标加工点"
            />
            <input
              v-model="newTransfer.logistics"
              class="input"
              placeholder="物流"
            />
            <input
              v-model="newTransfer.trackingNo"
              class="input"
              placeholder="运单号"
            />
          </div>
          <div class="mt-2">
            <button class="btn-primary" @click="registerTransfer">
              <Plus class="w-4 h-4" /> 登记调拨
            </button>
          </div>
        </div>
      </div>

      <div v-if="order" class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <Wrench class="w-4 h-4 text-violet-400" />
          <div class="section-title">返修进度</div>
          <div class="ml-auto mono">{{ repairs.length }} 笔</div>
        </div>
        <ul class="space-y-2">
          <li
            v-for="r in repairs"
            :key="r.id"
            class="rounded-xl border border-white/10 bg-ink-900/40 p-3"
          >
            <div class="flex items-center gap-2">
              <div class="text-sm text-paper/90">{{ r.reason }}</div>
              <span class="tag border-white/10 text-paper/70">{{
                r.status
              }}</span>
              <span class="mono ml-auto"
                >预计 {{ r.eta }} · 责任 {{ r.owner }}</span
              >
            </div>
            <div v-if="r.note" class="mono mt-1 text-paper/60">
              {{ r.note }}
            </div>
          </li>
          <li v-if="repairs.length === 0" class="text-sm text-paper/50">
            暂无返修记录
          </li>
        </ul>
      </div>
    </section>

    <aside class="flex flex-col gap-4 min-w-0">
      <EvidenceTimeline v-if="order" :order-id="order.id" title="加工证据链" />
      <div class="card-soft p-4">
        <div class="section-title mb-2">角色提示</div>
        <ul class="text-sm text-paper/80 space-y-1 list-disc list-inside">
          <li v-if="store.currentRole === 'manager'">
            查看调拨丢失与返修卡单，作为退款复核的证据来源。
          </li>
          <li v-else-if="store.currentRole === 'workshop'">
            登记调拨与返修状态，保持证据链连续。
          </li>
          <li v-else-if="store.currentRole === 'optometrist'">
            关注加工进度，必要时补充验光备注。
          </li>
          <li v-else>收集加工异常证据，为退款复核补齐前因后果。</li>
        </ul>
      </div>
    </aside>
  </div>
</template>
