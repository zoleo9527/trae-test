<template>
  <el-drawer
    :model-value="store.drawer.visible"
    :title="store.drawer.title"
    size="560px"
    direction="rtl"
    @close="onClose"
  >
    <!-- ========== 详情：退货申请 ========== -->
    <template v-if="mode === 'detail' && contextKind === 'return'">
      <div v-if="ret" class="drawer-form">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="申请编号">{{
            ret.id
          }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{
            ret.channelName || "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{
            ret.manager
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="returnStatusTag(ret.status)">{{
              returnStatusLabel(ret.status)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退货金额"
            >¥{{ ret.totalAmount.toFixed(2) }}</el-descriptions-item
          >
          <el-descriptions-item label="截止日期">{{
            ret.deadline
          }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{
            ret.note || "-"
          }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 18px 0 8px">退货明细</h4>
        <el-table :data="ret.lines" size="small" stripe>
          <el-table-column prop="title" label="书名" min-width="150" />
          <el-table-column prop="distributedQty" label="铺货" width="80" />
          <el-table-column prop="returnedQty" label="退货" width="80" />
          <el-table-column prop="reason" label="原因" width="110" />
        </el-table>

        <h4 style="margin: 18px 0 8px">操作留痕</h4>
        <HistoryPanel :entries="ret.history" />
      </div>
      <EmptyBlock v-else text="未找到退货申请" />
    </template>

    <!-- ========== 详情：调拨单 ========== -->
    <template v-else-if="mode === 'detail' && contextKind === 'transfer'">
      <div v-if="tr" class="drawer-form">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="调拨单号">{{
            tr.id
          }}</el-descriptions-item>
          <el-descriptions-item label="关联申请">
            <span
              v-if="tr.returnApplicationId"
              class="row-link"
              @click="jumpReturn(tr.returnApplicationId!)"
            >
              {{ tr.returnApplicationId }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="transferStatusTag(tr.status)">{{
              transferStatusLabel(tr.status)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险">
            <el-tag :type="riskTag(tr.risk)" size="small">{{
              riskLabel(tr.risk)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物流">
            {{ tr.courier || "-"
            }}<span v-if="tr.trackingNo"> · {{ tr.trackingNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{
            tr.note
          }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 18px 0 8px">调拨明细</h4>
        <el-table :data="tr.lines" size="small" stripe>
          <el-table-column prop="title" label="书名" min-width="150" />
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column label="去向" width="180">
            <template #default="{ row }"
              >{{ row.from }} → {{ row.to }}</template
            >
          </el-table-column>
        </el-table>

        <h4 style="margin: 18px 0 8px">操作留痕</h4>
        <HistoryPanel :entries="tr.history" />
      </div>
      <EmptyBlock v-else text="未找到调拨单" />
    </template>

    <!-- ========== 详情：样书回执 ========== -->
    <template v-else-if="mode === 'detail' && contextKind === 'receipt'">
      <div v-if="rcp" class="drawer-form">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="回执编号">{{
            rcp.receiptCode || "-"
          }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{
            rcp.channel
          }}</el-descriptions-item>
          <el-descriptions-item label="书名">{{
            rcp.bookTitle
          }}</el-descriptions-item>
          <el-descriptions-item label="册数">{{
            rcp.qty
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="receiptStatusTag(rcp.status)">{{
              receiptStatusLabel(rcp.status)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="补寄方式">{{
            receiptMethodLabel(rcp.method)
          }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{
            rcp.remark || rcp.note
          }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 18px 0 8px">操作留痕</h4>
        <HistoryPanel :entries="rcp.history" />
      </div>
      <EmptyBlock v-else text="未找到回执记录" />
    </template>

    <!-- ========== 详情：对账台账 ========== -->
    <template v-else-if="mode === 'detail' && contextKind === 'reconciliation'">
      <div v-if="rec" class="drawer-form">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="台账编号">{{
            rec.id
          }}</el-descriptions-item>
          <el-descriptions-item label="月份">{{
            rec.month
          }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{
            rec.channel
          }}</el-descriptions-item>
          <el-descriptions-item label="书名">{{
            rec.bookTitle
          }}</el-descriptions-item>
          <el-descriptions-item label="应退">{{
            rec.expectedReturn
          }}</el-descriptions-item>
          <el-descriptions-item label="实退">{{
            rec.actualReturn
          }}</el-descriptions-item>
          <el-descriptions-item label="差额">
            <span
              :style="{
                color:
                  rec.delta === 0 ? 'var(--app-success)' : 'var(--app-danger)',
              }"
              >{{ rec.delta }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="口径说明">{{
            rec.caliber
          }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="reconStatusTag(rec.status)">{{
              reconStatusLabel(rec.status)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="核对人">{{
            rec.checker
          }}</el-descriptions-item>
          <el-descriptions-item label="最近核对">{{
            rec.lastCheckedAt
          }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 18px 0 8px">操作留痕</h4>
        <HistoryPanel :entries="rec.history" />
      </div>
      <EmptyBlock v-else text="未找到对账记录" />
    </template>

    <!-- ========== 编辑：退货草稿 ========== -->
    <template v-else-if="mode === 'edit' && contextKind === 'return'">
      <div v-if="ret" class="drawer-form">
        <el-alert type="info" :closable="false" style="margin-bottom: 14px">
          <template #title
            >补全基础信息与退货明细后即可提交，所有修改都会留痕。</template
          >
        </el-alert>

        <el-form label-position="top">
          <el-form-item label="渠道名称" required>
            <el-input
              v-model="editForm.channelName"
              placeholder="如：华东新华·上海书城"
            />
          </el-form-item>
          <el-form-item label="渠道代码">
            <el-input v-model="editForm.channelCode" placeholder="如：CH001" />
          </el-form-item>
          <el-form-item label="截止日期">
            <el-date-picker
              v-model="editForm.deadline"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择截止日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="editForm.note" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>

        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 12px 0 8px;
          "
        >
          <strong>退货明细（{{ ret.lines.length }} 条）</strong>
          <el-button size="small" type="primary" plain @click="addLine">
            <el-icon class="el-icon--left"><Plus /></el-icon>新增一条
          </el-button>
        </div>

        <div
          v-if="ret.lines.length === 0"
          style="color: var(--app-sub-text); font-size: 13px; padding: 12px 0"
        >
          尚未添加任何明细，点击"新增一条"开始补全。
        </div>

        <div
          v-for="(line, idx) in ret.lines"
          :key="idx"
          style="
            border: 1px solid var(--app-border);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
          "
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            "
          >
            <strong style="font-size: 13px">明细 #{{ idx + 1 }}</strong>
            <el-button link type="danger" size="small" @click="removeLine(idx)"
              >删除</el-button
            >
          </div>
          <el-form label-position="top" size="small">
            <div
              style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px"
            >
              <el-form-item label="书名" required>
                <el-input
                  v-model="line.title"
                  @blur="onLineChange(idx)"
                  @change="onLineChange(idx)"
                />
              </el-form-item>
              <el-form-item label="ISBN">
                <el-input v-model="line.isbn" @blur="onLineChange(idx)" />
              </el-form-item>
              <el-form-item label="单价（元）" required>
                <el-input-number
                  v-model="line.price"
                  :min="0"
                  :precision="2"
                  :step="0.1"
                  style="width: 100%"
                  @change="onLineChange(idx)"
                />
              </el-form-item>
              <el-form-item label="铺货数">
                <el-input-number
                  v-model="line.distributedQty"
                  :min="0"
                  style="width: 100%"
                  @change="onLineChange(idx)"
                />
              </el-form-item>
              <el-form-item label="退货数" required>
                <el-input-number
                  v-model="line.returnedQty"
                  :min="1"
                  style="width: 100%"
                  @change="onLineChange(idx)"
                />
              </el-form-item>
              <el-form-item label="退货原因">
                <el-select
                  v-model="line.reason"
                  placeholder="选择原因"
                  style="width: 100%"
                  @change="onLineChange(idx)"
                >
                  <el-option value="滞销" label="滞销" />
                  <el-option value="包装破损" label="包装破损" />
                  <el-option value="样书寄回" label="样书寄回" />
                  <el-option value="渠道撤架" label="渠道撤架" />
                  <el-option value="临时停售" label="临时停售" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </div>

        <el-divider />
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span style="color: var(--app-sub-text); font-size: 13px">
            退货总额：<strong style="color: var(--app-text)"
              >¥{{ ret.totalAmount.toFixed(2) }}</strong
            >
          </span>
        </div>
      </div>
      <EmptyBlock v-else text="未找到草稿" />
    </template>

    <!-- ========== 异常处理 ========== -->
    <template v-else-if="mode === 'exception'">
      <div class="drawer-form">
        <el-alert type="warning" :closable="false" style="margin-bottom: 14px">
          <template #title>
            异常处理是留痕的第一现场，请完整填写处理动作与意见，用于月底对账回查。
          </template>
        </el-alert>
        <el-form label-position="top">
          <el-form-item label="异常类型">
            <el-radio-group v-model="exForm.type">
              <el-radio value="receipt">样书回执丢失</el-radio>
              <el-radio value="caliber">退货口径不一</el-radio>
              <el-radio value="quantity">数量与铺货不符</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理动作">
            <el-radio-group v-model="exForm.action">
              <el-radio value="resubmit">退回补充</el-radio>
              <el-radio value="reject">驳回</el-radio>
              <el-radio value="approve">附说明通过</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理意见（必填）">
            <el-input
              v-model="exForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请详细描述异常原因和处理说明，将写入留痕"
            />
          </el-form-item>
        </el-form>
      </div>
    </template>

    <!-- ========== 样书回执补录 ========== -->
    <template v-else-if="mode === 'receipt'">
      <div v-if="rcp" class="drawer-form">
        <el-alert type="warning" :closable="false" style="margin-bottom: 14px">
          <template #title
            >样书回执丢失，请填写回执信息，财务对账依赖此记录。</template
          >
        </el-alert>
        <el-descriptions
          :column="1"
          border
          size="small"
          style="margin-bottom: 14px"
        >
          <el-descriptions-item label="渠道">{{
            rcp.channel
          }}</el-descriptions-item>
          <el-descriptions-item label="书名">{{
            rcp.bookTitle
          }}</el-descriptions-item>
          <el-descriptions-item label="册数">{{
            rcp.qty
          }}</el-descriptions-item>
        </el-descriptions>
        <el-form label-position="top">
          <el-form-item label="回执编号" required>
            <el-input v-model="rcForm.code" placeholder="如：RC20250525001" />
          </el-form-item>
          <el-form-item label="补寄方式" required>
            <el-radio-group v-model="rcForm.method">
              <el-radio value="mail">纸质寄回</el-radio>
              <el-radio value="online">线上扫描</el-radio>
              <el-radio value="note">书面说明</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理意见">
            <el-input
              v-model="rcForm.remark"
              type="textarea"
              :rows="3"
              placeholder="补寄安排、渠道联系人等"
            />
          </el-form-item>
        </el-form>
      </div>
      <EmptyBlock v-else text="未找到回执记录" />
    </template>

    <!-- ========== 对账重新核对 ========== -->
    <template v-else-if="mode === 'reconcile'">
      <div v-if="rec" class="drawer-form">
        <el-alert type="info" :closable="false" style="margin-bottom: 14px">
          <template #title>重新核对后会更新口径说明并写入留痕。</template>
        </el-alert>
        <el-descriptions
          :column="1"
          border
          size="small"
          style="margin-bottom: 14px"
        >
          <el-descriptions-item label="渠道">{{
            rec.channel
          }}</el-descriptions-item>
          <el-descriptions-item label="书名">{{
            rec.bookTitle
          }}</el-descriptions-item>
          <el-descriptions-item label="应退 / 实退"
            >{{ rec.expectedReturn }} /
            {{ rec.actualReturn }}</el-descriptions-item
          >
          <el-descriptions-item label="差额">
            <span
              :style="{
                color:
                  rec.delta === 0 ? 'var(--app-success)' : 'var(--app-danger)',
              }"
              >{{ rec.delta }}</span
            >
          </el-descriptions-item>
        </el-descriptions>
        <el-form label-position="top">
          <el-form-item label="核对结果说明（口径）" required>
            <el-input
              v-model="reconForm.comment"
              type="textarea"
              :rows="4"
              placeholder="重新核对的口径说明，将替换原口径说明并写入留痕"
            />
          </el-form-item>
        </el-form>
      </div>
      <EmptyBlock v-else text="未找到对账记录" />
    </template>

    <!-- ========== 未知 / 空态 ========== -->
    <template v-else>
      <EmptyBlock text="页面加载中，请稍候…" />
    </template>

    <!-- ========== 底部操作 ========== -->
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
import { ElMessage } from "element-plus";
import { useConsoleStore } from "@/stores/console";
import EmptyBlock from "@/components/common/EmptyBlock.vue";
import HistoryPanel from "@/components/common/HistoryPanel.vue";
import type { ReturnLine } from "@/types/domain";

const store = useConsoleStore();
const router = useRouter();

const mode = computed(() => store.drawer.mode);
const contextKind = computed(() => store.drawer.contextKind);

const ret = computed(() => store.selectedReturn);
const tr = computed(() => store.selectedTransfer);
const rcp = computed(() => {
  if (store.selectedReceipt) return store.selectedReceipt;
  const ctx = store.drawer.context;
  return ctx &&
    typeof ctx === "object" &&
    "id" in ctx &&
    (ctx as { id?: string }).id?.startsWith("RC")
    ? (ctx as Parameters<typeof store.receipts.find>[0] extends never
        ? never
        : (typeof store.receipts)[number])
    : undefined;
});
const rec = computed(() => {
  if (store.selectedReconciliation) return store.selectedReconciliation;
  const ctx = store.drawer.context;
  return ctx &&
    typeof ctx === "object" &&
    "id" in ctx &&
    (ctx as { id?: string }).id?.startsWith("REC")
    ? (ctx as Parameters<typeof store.reconciliations.find>[0] extends never
        ? never
        : (typeof store.reconciliations)[number])
    : undefined;
});

const editForm = reactive({
  channelName: "",
  channelCode: "",
  deadline: "",
  note: "",
});

const exForm = reactive({ type: "caliber", action: "resubmit", comment: "" });
const rcForm = reactive({
  code: "",
  method: "online" as "mail" | "online" | "note",
  remark: "",
});
const reconForm = reactive({ comment: "" });

watch(
  () => store.drawer.visible,
  (v) => {
    if (v) {
      if (mode.value === "edit" && ret.value) {
        editForm.channelName = ret.value.channelName;
        editForm.channelCode = ret.value.channelCode;
        editForm.deadline = ret.value.deadline;
        editForm.note = ret.value.note;
      }
      exForm.type = "caliber";
      exForm.action = "resubmit";
      exForm.comment = "";
      rcForm.code = rcp.value?.receiptCode || "";
      rcForm.method = rcp.value?.method || "online";
      rcForm.remark = rcp.value?.remark || "";
      reconForm.comment = "";
    }
  },
);

const canSubmit = computed(() => {
  if (mode.value === "exception") return exForm.comment.trim().length >= 2;
  if (mode.value === "receipt") return rcForm.code.trim().length >= 2;
  if (mode.value === "reconcile") return reconForm.comment.trim().length >= 2;
  if (mode.value === "edit")
    return (
      ret.value?.lines.length! > 0 && editForm.channelName.trim().length > 0
    );
  return true;
});

const submitText = computed(() => {
  if (mode.value === "exception") return "提交异常处理";
  if (mode.value === "receipt") return "补录回执";
  if (mode.value === "reconcile") return "确认核对";
  if (mode.value === "edit") return "保存并提交";
  return "完成";
});

function onClose() {
  store.closeDrawer();
}

function jumpReturn(id: string) {
  store.selectReturn(id);
  router.push("/returns");
  store.closeDrawer();
}

function addLine() {
  if (!ret.value || ret.value.status !== "draft") return;
  store.addReturnLine(ret.value.id, {
    title: "",
    author: "",
    category: "",
    price: 0,
    distributedQty: 0,
    returnedQty: 0,
    reason: "滞销",
  });
}

function removeLine(idx: number) {
  if (!ret.value || ret.value.status !== "draft") return;
  store.removeReturnLine(ret.value.id, idx);
}

function onLineChange(idx: number) {
  if (!ret.value || ret.value.status !== "draft") return;
  const line = ret.value.lines[idx];
  if (!line) return;
  if (!line.title || line.title.trim().length === 0) return;
  if (!line.returnedQty || line.returnedQty <= 0) return;
  store.updateReturnLine(ret.value.id, idx, { ...line });
}

function submit() {
  if (!canSubmit.value) {
    if (mode.value === "edit" && ret.value?.lines.length === 0) {
      ElMessage.warning("请至少添加一条退货明细");
    }
    return;
  }

  if (mode.value === "edit" && ret.value) {
    store.updateDraftReturn(ret.value.id, {
      channelName: editForm.channelName,
      channelCode: editForm.channelCode,
      deadline: editForm.deadline || ret.value.deadline,
      note: editForm.note,
    });
    try {
      store.submitReturn(ret.value.id);
      ElMessage.success("退货申请已提交");
      store.closeDrawer();
    } catch (e) {
      ElMessage.warning((e as Error).message);
    }
    return;
  }

  if (mode.value === "exception") {
    const kind = contextKind.value;
    const id =
      kind === "return"
        ? ret.value?.id
        : kind === "transfer"
          ? tr.value?.id
          : undefined;
    if (!id || !kind) {
      ElMessage.warning("未确定处理目标");
      return;
    }
    store.handleException(
      id,
      kind as "return" | "transfer",
      exForm.action as "reject" | "approve" | "resubmit",
      exForm.comment,
      exForm.type,
    );
    ElMessage.success("异常处理已记录");
    store.closeDrawer();
    return;
  }

  if (mode.value === "receipt" && rcp.value) {
    store.updateReceipt(rcp.value.id, {
      receiptCode: rcForm.code,
      method: rcForm.method as "mail" | "online" | "note",
      remark: rcForm.remark,
    });
    ElMessage.success("样书回执已补录");
    store.closeDrawer();
    return;
  }

  if (mode.value === "reconcile" && rec.value) {
    store.markReconciliationReviewed(rec.value.id, reconForm.comment);
    ElMessage.success("核对结果已记录");
    store.closeDrawer();
    return;
  }
}

function returnStatusLabel(s: string) {
  return (
    {
      draft: "草稿",
      submitted: "待审核",
      reviewing: "审核中",
      approved: "已通过",
      rejected: "已驳回",
      closed: "已关闭",
    }[s] || s
  );
}
function returnStatusTag(s: string) {
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
    )[s] || ""
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
function receiptStatusLabel(s: string) {
  return (
    {
      pending: "待提交",
      submitted: "已提交",
      missing: "丢失",
      confirmed: "已确认",
    }[s] || s
  );
}
function receiptStatusTag(s: string) {
  return (
    (
      {
        pending: "info",
        submitted: "warning",
        missing: "danger",
        confirmed: "success",
      } as Record<string, "info" | "warning" | "success" | "danger" | "">
    )[s] || ""
  );
}
function receiptMethodLabel(m?: string) {
  return (
    { mail: "纸质寄回", online: "线上扫描", note: "书面说明" }[m || ""] || "-"
  );
}
function reconStatusLabel(s: string) {
  return { matched: "已一致", mismatch: "口径不一", pending: "待核" }[s] || s;
}
function reconStatusTag(s: string) {
  return (
    (
      { matched: "success", mismatch: "danger", pending: "warning" } as Record<
        string,
        "success" | "danger" | "warning" | ""
      >
    )[s] || ""
  );
}
</script>
