<template>
  <el-drawer
    :model-value="store.drawer.visible"
    :title="store.drawer.title"
    size="520px"
    direction="rtl"
    @close="onClose"
  >
    <template v-if="mode === 'detail'">
      <div v-if="isReturn" class="drawer-form">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="申请编号">{{
            selectedReturn?.id
          }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{
            selectedReturn?.channelName
          }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{
            selectedReturn?.manager
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="returnStatusTag(selectedReturn?.status || '')">{{
              returnStatusLabel(selectedReturn?.status || "")
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退货金额"
            >¥{{
              (selectedReturn?.totalAmount || 0).toFixed(2)
            }}</el-descriptions-item
          >
          <el-descriptions-item label="截止日期">{{
            selectedReturn?.deadline
          }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{
            selectedReturn?.note
          }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 18px 0 8px">退货明细</h4>
        <el-table :data="selectedReturn?.lines || []" size="small" stripe>
          <el-table-column prop="title" label="书名" min-width="150" />
          <el-table-column prop="distributedQty" label="铺货" width="80" />
          <el-table-column prop="returnedQty" label="退货" width="80" />
          <el-table-column prop="reason" label="原因" width="110" />
        </el-table>

        <h4 style="margin: 18px 0 8px">操作留痕</h4>
        <HistoryPanel :entries="selectedReturn?.history || []" />
      </div>

      <div v-else-if="isTransfer" class="drawer-form">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="调拨单号">{{
            selectedTransfer?.id
          }}</el-descriptions-item>
          <el-descriptions-item label="关联申请">
            <span
              v-if="selectedTransfer?.returnApplicationId"
              class="row-link"
              @click="jumpReturn(selectedTransfer?.returnApplicationId || '')"
            >
              {{ selectedTransfer?.returnApplicationId }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="transferStatusTag(selectedTransfer?.status || '')">{{
              transferStatusLabel(selectedTransfer?.status || "")
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险">
            <el-tag
              :type="riskTag(selectedTransfer?.risk || 'low')"
              size="small"
              >{{ riskLabel(selectedTransfer?.risk || "low") }}</el-tag
            >
          </el-descriptions-item>
          <el-descriptions-item label="物流">
            {{ selectedTransfer?.courier || "-" }}
            <span v-if="selectedTransfer?.trackingNo">
              · {{ selectedTransfer.trackingNo }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{
            selectedTransfer?.note
          }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 18px 0 8px">调拨明细</h4>
        <el-table :data="selectedTransfer?.lines || []" size="small" stripe>
          <el-table-column prop="title" label="书名" min-width="150" />
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column label="去向" width="180">
            <template #default="{ row }"
              >{{ row.from }} → {{ row.to }}</template
            >
          </el-table-column>
        </el-table>

        <h4 style="margin: 18px 0 8px">操作留痕</h4>
        <HistoryPanel :entries="selectedTransfer?.history || []" />
      </div>

      <EmptyBlock v-else text="未找到详情" />
    </template>

    <template v-else-if="mode === 'exception'">
      <div class="drawer-form">
        <el-alert type="warning" :closable="false" style="margin-bottom: 14px">
          <template #title>
            异常处理是留痕的第一现场，请完整填写处理动作与意见，用于月底对账回查。
          </template>
        </el-alert>
        <el-form label-position="top">
          <el-form-item label="异常类型">
            <el-radio-group v-model="form.type">
              <el-radio value="receipt">样书回执丢失</el-radio>
              <el-radio value="caliber">退货口径不一</el-radio>
              <el-radio value="quantity">数量与铺货不符</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理动作">
            <el-radio-group v-model="form.action">
              <el-radio value="resubmit">退回补充</el-radio>
              <el-radio value="reject">驳回</el-radio>
              <el-radio value="approve">附说明通过</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理意见">
            <el-input
              v-model="form.comment"
              type="textarea"
              :rows="4"
              placeholder="请详细描述异常原因和处理说明，将写入留痕"
            />
          </el-form-item>
        </el-form>
      </div>
    </template>

    <template v-else-if="mode === 'receipt'">
      <div class="drawer-form">
        <el-alert type="warning" :closable="false" style="margin-bottom: 14px">
          <template #title
            >样书回执丢失，请上传回执或备注补寄安排，财务对账依赖此记录。</template
          >
        </el-alert>
        <el-form label-position="top">
          <el-form-item label="回执编号">
            <el-input
              v-model="receiptForm.code"
              placeholder="如：RC20250525001"
            />
          </el-form-item>
          <el-form-item label="补寄方式">
            <el-radio-group v-model="receiptForm.method">
              <el-radio value="mail">纸质寄回</el-radio>
              <el-radio value="online">线上扫描</el-radio>
              <el-radio value="note">书面说明</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="receiptForm.comment" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </div>
    </template>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" :disabled="!canSubmit" @click="submit">
          {{ submitText }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useConsoleStore } from "@/stores/console";
import EmptyBlock from "@/components/common/EmptyBlock.vue";
import HistoryPanel from "@/components/common/HistoryPanel.vue";

const store = useConsoleStore();
const router = useRouter();

const mode = computed(() => store.drawer.mode);
const ctx = computed(
  () => store.drawer.context as Record<string, unknown> | undefined,
);
const isReturn = computed(
  () => !!(ctx?.["channelName"] || store.selectedReturn),
);
const isTransfer = computed(
  () => !!(ctx?.["lines"] && ctx?.["initiator"]) || !!store.selectedTransfer,
);

const selectedReturn = computed(() => {
  if (store.selectedReturn) return store.selectedReturn;
  if (isReturn.value) return ctx.value as unknown as ReturnApplicationLike;
  return undefined;
});

const selectedTransfer = computed(() => {
  if (store.selectedTransfer) return store.selectedTransfer;
  if (isTransfer.value) return ctx.value as unknown as TransferLike;
  return undefined;
});

const form = reactive({ type: "caliber", action: "resubmit", comment: "" });
const receiptForm = reactive({ code: "", method: "online", comment: "" });

watch(
  () => store.drawer.visible,
  (v) => {
    if (v) {
      form.type = "caliber";
      form.action = "resubmit";
      form.comment = "";
      receiptForm.code = "";
      receiptForm.method = "online";
      receiptForm.comment = "";
    }
  },
);

const canSubmit = computed(() => {
  if (mode.value === "exception") return form.comment.trim().length >= 2;
  if (mode.value === "receipt") return receiptForm.code.trim().length >= 2;
  return true;
});

const submitText = computed(() => {
  if (mode.value === "exception") return "提交异常处理";
  if (mode.value === "receipt") return "补录回执";
  return "完成";
});

function onClose() {
  store.closeDrawer();
}

function submit() {
  if (!canSubmit.value) return;
  const target = selectedReturn.value;
  if (mode.value === "exception" && target) {
    const id = (target as { id: string }).id;
    if (form.action === "reject") {
      store.rejectReturn(id, form.comment);
    } else if (form.action === "approve") {
      store.approveReturn(id, form.comment);
    } else {
      store.appendHistory("return", id, {
        role: "issuer",
        operator: "发行专员·周凯",
        action: "退回补充",
        comment: form.comment,
      });
    }
  }
  if (mode.value === "receipt") {
    const context = store.drawer.context as { id?: string } | undefined;
    if (context?.id) store.confirmReceipt(context.id);
  }
  store.closeDrawer();
}

function jumpReturn(id: string) {
  store.selectReturn(id);
  router.push("/returns");
  store.closeDrawer();
}

function returnStatusLabel(status: string) {
  return (
    {
      draft: "草稿",
      submitted: "待审核",
      reviewing: "审核中",
      approved: "已通过",
      rejected: "已驳回",
      closed: "已关闭",
    }[status] || status
  );
}
function returnStatusTag(status: string) {
  return (
    (
      {
        draft: "info",
        submitted: "warning",
        reviewing: "warning",
        approved: "success",
        rejected: "danger",
        closed: "info",
      } as Record<string, "info" | "warning" | "success" | "danger" | "">
    )[status] || ""
  );
}
function transferStatusLabel(s: string) {
  return (
    {
      pending: "待发货",
      processing: "在途",
      completed: "已完成",
      shipped: "已发货",
      rejected: "已驳回",
    }[s] || s
  );
}
function transferStatusTag(s: string) {
  return (
    (
      {
        pending: "warning",
        processing: "primary",
        completed: "success",
        shipped: "primary",
        rejected: "danger",
      } as Record<string, "warning" | "primary" | "success" | "danger" | "">
    )[s] || ""
  );
}
function riskLabel(r: string) {
  return { low: "低", medium: "中", high: "高" }[r] || r;
}
function riskTag(r: string) {
  return (
    (
      { low: "success", medium: "warning", high: "danger" } as Record<
        string,
        "success" | "warning" | "danger" | ""
      >
    )[r] || ""
  );
}

interface ReturnApplicationLike {
  id: string;
  channelName: string;
  manager: string;
  status: string;
  totalAmount: number;
  deadline: string;
  note: string;
  lines: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
}
interface TransferLike {
  id: string;
  status: string;
  risk: string;
  courier?: string;
  trackingNo?: string;
  note: string;
  lines: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
}
</script>
