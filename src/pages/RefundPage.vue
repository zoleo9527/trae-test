<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore, statusLabel } from "@/store/app";
import {
  FileWarning,
  CheckCircle,
  XCircle,
  MessageSquareWarning,
  Paperclip,
  Save,
  Plus,
} from "lucide-vue-next";
import EvidenceTimeline from "@/components/EvidenceTimeline.vue";

const store = useAppStore();

const refund = computed(() =>
  store.db.refunds.find((r) => r.id === store.selectedRefundId),
);
const order = computed(() =>
  refund.value ? store.orderById(refund.value.orderId) : undefined,
);
const customer = computed(() =>
  order.value ? store.customerOf(order.value) : undefined,
);
const pkg = computed(() =>
  order.value ? store.pkgOf(order.value) : undefined,
);

const showCreateForm = ref(false);
const createForm = ref({
  orderId: "",
  reason: "",
});

const canCreateRefund = computed(() => {
  return store.currentRole === "service" || store.currentRole === "manager";
});

const canReview = computed(() => {
  return store.currentRole === "manager";
});

function createRefund() {
  if (!createForm.value.orderId || !createForm.value.reason.trim()) return;
  const o = store.orderById(createForm.value.orderId);
  if (!o) return;
  const p = store.pkgOf(o);
  if (!p) return;
  const newRefund = store.createRefund(o.id, p.price, createForm.value.reason.trim());
  store.selectedRefundId = newRefund.id;
  createForm.value = { orderId: "", reason: "" };
  showCreateForm.value = false;
}

const decision = ref<"approve" | "reject" | "">("");
const reasonText = ref("");

function decide() {
  if (!refund.value) return;
  if (!decision.value || !reasonText.value.trim()) return;
  if (!canReview.value) return;
  const actor = store.currentActor;
  const now = new Date();
  const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  store.updateRefund(refund.value.id, {
    status: decision.value === "approve" ? "approved" : "rejected",
    reviewer: actor?.name,
    reviewedAt: iso,
    decision: reasonText.value.trim(),
  });
  store.addNote({
    orderId: refund.value.orderId,
    kind: decision.value === "approve" ? "supplement" : "reject",
    role: actor?.role ?? "manager",
    actor: actor?.name ?? "复核人",
    content: `复核结论：${decision.value === "approve" ? "通过" : "驳回"}。${reasonText.value.trim()}`,
  });
  if (decision.value === "approve" && order.value) {
    order.value.status = "refunded";
  }
  decision.value = "";
  reasonText.value = "";
}

function pad(n: number) {
  return n < 10 ? "0" + n : String(n);
}

function selectRefund(id: string) {
  store.selectedRefundId = id;
}

const refundStatusLabel: Record<string, string> = {
  requested: '已申请',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
};
</script>

<template>
  <div class="p-6 grid grid-cols-[260px_minmax(0,1fr)_360px] gap-5 h-full">
    <aside class="card-soft p-3 flex flex-col gap-2 overflow-auto">
      <div class="flex items-center justify-between px-2 py-1">
        <div class="mono text-paper/60">退款申请</div>
        <button
          v-if="canCreateRefund"
          class="btn-ghost text-xs py-1 px-2"
          @click="showCreateForm = !showCreateForm"
        >
          <Plus class="w-3.5 h-3.5" /> 发起
        </button>
      </div>

      <div v-if="showCreateForm" class="card-soft p-3 mb-2 space-y-2">
        <div class="mono text-paper/60">发起退款</div>
        <select v-model="createForm.orderId" class="input text-sm">
          <option value="">选择订单</option>
          <option
            v-for="o in store.orders.value.filter(x => x.status !== 'refunded' && x.status !== 'pending')"
            :key="o.id"
            :value="o.id"
          >
            {{ o.code }} · {{ store.customerOf(o)?.name }}
          </option>
        </select>
        <textarea
          v-model="createForm.reason"
          class="input text-sm min-h-[60px] resize-none"
          placeholder="退款原因..."
        ></textarea>
        <div class="flex gap-2">
          <button class="btn-primary text-xs py-1 px-2" @click="createRefund">
            提交申请
          </button>
          <button class="btn-ghost text-xs py-1 px-2" @click="showCreateForm = false">
            取消
          </button>
        </div>
      </div>

      <button
        v-for="r in store.db.refunds"
        :key="r.id"
        class="text-left rounded-lg px-3 py-2 transition"
        :class="
          store.selectedRefundId === r.id
            ? 'bg-amber2-500/15 ring-1 ring-amber2-500/40'
            : 'hover:bg-white/5'
        "
        @click="selectRefund(r.id)"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm text-paper/90 truncate">#{{ r.id }}</div>
          <span
            class="tag"
            :class="
              r.status === 'reviewing'
                ? 'border-amber2-500/40 text-amber2-500'
                : r.status === 'approved'
                  ? 'border-moss-500/40 text-moss-500'
                  : r.status === 'rejected'
                    ? 'border-rose-500/40 text-rose-400'
                    : 'border-white/10 text-paper/70'
            "
            >{{ refundStatusLabel[r.status] }}</span
          >
        </div>
        <div class="mono mt-1">¥{{ r.amount }}</div>
        <div class="mono truncate">{{ r.reason }}</div>
      </button>

      <div v-if="!canCreateRefund" class="px-2 py-1 mono text-paper/50 text-xs">
        仅售后和店经理可发起退款
      </div>
    </aside>

    <section class="flex flex-col gap-4 min-w-0">
      <div v-if="refund && order" class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <FileWarning class="w-5 h-5 text-amber2-500" />
          <div class="section-title">退款详情</div>
          <div class="ml-auto mono">申请时间 {{ refund.requestedAt }}</div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div class="card-soft p-3">
            <div class="mono">订单</div>
            <div class="font-mono mt-1">{{ order.code }}</div>
            <div class="mono mt-1">状态：{{ statusLabel[order.status] }}</div>
          </div>
          <div class="card-soft p-3">
            <div class="mono">顾客</div>
            <div class="mt-1">{{ customer?.name }} · {{ customer?.phone }}</div>
            <div class="mono mt-1">{{ customer?.memberNo }}</div>
          </div>
          <div class="card-soft p-3">
            <div class="mono">套餐</div>
            <div class="mt-1">{{ pkg?.name }}</div>
            <div class="mono mt-1 text-amber2-500">
              退款 ¥{{ refund.amount }}
            </div>
          </div>
        </div>
        <div class="mt-4 card-soft p-3">
          <div class="mono">前因摘要</div>
          <div class="mt-1 text-paper/90">{{ refund.reason }}</div>
          <div class="mono mt-2">
            申请人：{{ refund.requestedBy }} · 状态：{{ refundStatusLabel[refund.status] }}
          </div>
          <div v-if="refund.reviewer" class="mono mt-1">
            复核人：{{ refund.reviewer }} · {{ refund.reviewedAt }}
          </div>
          <div v-if="refund.decision" class="mono mt-1">
            结论：{{ refund.decision }}
          </div>
        </div>
      </div>

      <div v-if="refund && order" class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <MessageSquareWarning class="w-4 h-4 text-rose-400" />
          <div class="section-title">复核结论</div>
          <div class="ml-auto mono text-paper/50">
            {{ canReview ? '店经理可操作' : '仅店经理可复核' }}
          </div>
        </div>
        <div v-if="refund.status === 'reviewing'" class="space-y-3">
          <div class="flex items-center gap-2">
            <button
              class="btn"
              :class="decision === 'approve' ? 'btn-primary' : 'btn-ghost'"
              :disabled="!canReview"
              @click="decision = 'approve'"
            >
              <CheckCircle class="w-4 h-4" /> 通过退款
            </button>
            <button
              class="btn"
              :class="
                decision === 'reject'
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'btn-ghost'
              "
              :disabled="!canReview"
              @click="decision = 'reject'"
            >
              <XCircle class="w-4 h-4" /> 驳回
            </button>
          </div>
          <textarea
            v-model="reasonText"
            class="input min-h-[100px] resize-none"
            :disabled="!canReview"
            :placeholder="
              !canReview
                ? '仅店经理可填写复核结论'
                : decision === 'reject'
                  ? '请写清驳回原因，让申请人知道下一步要补什么。'
                  : '请写清复核结论，作为证据链留存。'
            "
          ></textarea>
          <div class="flex items-center gap-2">
            <button
              class="btn-amber"
              :disabled="!decision || !reasonText.trim() || !canReview"
              @click="decide"
            >
              <Save class="w-4 h-4" /> 提交复核结论
            </button>
            <span v-if="!canReview" class="mono text-rose-400">
              您没有复核权限
            </span>
            <span v-else class="mono text-paper/50">
              填写后将沉淀为证据链
            </span>
          </div>
        </div>
        <div v-else class="text-sm text-paper/60">
          该退款申请已完成处理
        </div>
      </div>
    </section>

    <aside class="flex flex-col gap-4 min-w-0">
      <EvidenceTimeline v-if="order" :order-id="order.id" title="完整证据链" />
      <div class="card-soft p-4">
        <div class="section-title mb-2">驳回原因 / 补录说明</div>
        <ul class="space-y-2">
          <li
            v-for="n in order
              ? store
                  .notesOf(order.id)
                  .filter((x) => x.kind === 'reject' || x.kind === 'supplement')
              : []"
            :key="n.id"
            class="rounded-lg border border-white/10 bg-ink-900/40 p-2 text-sm"
          >
            <div class="mono text-paper/60">
              {{ n.createdAt }} · {{ n.actor }}
            </div>
            <div class="mt-1">{{ n.content }}</div>
            <div
              v-if="n.attach"
              class="mono text-paper/50 mt-1 inline-flex items-center gap-1"
            >
              <Paperclip class="w-3 h-3" /> {{ n.attach }}
            </div>
          </li>
          <li
            v-if="
              order &&
              store
                .notesOf(order.id)
                .filter((x) => x.kind === 'reject' || x.kind === 'supplement')
                .length === 0
            "
            class="text-sm text-paper/50"
          >
            暂无
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>
