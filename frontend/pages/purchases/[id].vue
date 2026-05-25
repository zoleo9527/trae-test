<template>
  <div class="p-6">
    <div v-if="purchase" class="card p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-slate-500">进货单</div>
          <div class="text-lg font-bold">
            {{ purchase.code }} · {{ purchase.product_name }}
          </div>
          <div class="text-sm text-slate-500 mt-1">
            供应商：{{ purchase.supplier_name }}（{{ purchase.supplier_contact
            }}{{
              purchase.supplier_region ? " · " + purchase.supplier_region : ""
            }}） · 净重 {{ purchase.net_kg }} 斤 · 冷库
            {{ purchase.warehouse_in }} · 车牌号 {{ purchase.truck_no }}
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn-ghost" @click="$router.push('/purchases')">
            返回列表
          </button>
        </div>
      </div>
      <div
        v-if="purchase.remark"
        class="mt-2 text-sm text-slate-600 bg-brand-50 border border-brand-100 rounded p-2"
      >
        备注：{{ purchase.remark }}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div class="lg:col-span-8 space-y-4">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold">分级明细</div>
            <button class="btn-primary" @click="showGrading = true">
              新增分级
            </button>
          </div>
          <table class="fruit">
            <thead>
              <tr>
                <th>等级</th>
                <th>重量</th>
                <th>占比</th>
                <th>单位成本</th>
                <th>备注</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in trace.gradings" :key="g.id">
                <td>
                  <span :class="gradeColor(g.grade)" class="tag">{{
                    g.grade
                  }}</span>
                </td>
                <td>{{ g.weight_kg }} 斤</td>
                <td>{{ (g.ratio * 100).toFixed(1) }}%</td>
                <td>¥{{ g.unit_cost }}</td>
                <td class="text-xs text-slate-500">{{ g.remark }}</td>
                <td>
                  <button
                    class="text-rose-600 hover:underline"
                    @click="delGrading(g.id)"
                  >
                    删除
                  </button>
                </td>
              </tr>
              <tr v-if="!trace.gradings.length">
                <td colspan="6" class="text-center text-slate-400 py-4">
                  暂无分级记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold">档口配货明细</div>
            <button class="btn-primary" @click="showAllocation = true">
              新增配货
            </button>
          </div>
          <table class="fruit">
            <thead>
              <tr>
                <th>客户</th>
                <th>档口</th>
                <th>等级</th>
                <th>数量</th>
                <th>单价</th>
                <th>金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in trace.allocations" :key="a.id">
                <td>{{ a.customer_name }}</td>
                <td>{{ a.customer_stall }}</td>
                <td>
                  <span :class="gradeColor(a.grade)" class="tag">{{
                    a.grade
                  }}</span>
                </td>
                <td>{{ a.qty_kg }} 斤</td>
                <td>¥{{ a.unit_price }}</td>
                <td>¥{{ a.total_amount?.toFixed(0) }}</td>
                <td>
                  <span :class="allocStatusColor(a.status)" class="tag">{{
                    a.status
                  }}</span>
                </td>
                <td class="flex gap-2 text-xs">
                  <button
                    v-if="a.status === '待提货'"
                    class="text-brand-600 hover:underline"
                    @click="updateAllocStatus(a.id, '已提货')"
                  >
                    已提货
                  </button>
                  <button
                    class="text-rose-600 hover:underline"
                    @click="updateAllocStatus(a.id, '已退货')"
                  >
                    退货
                  </button>
                </td>
              </tr>
              <tr v-if="!trace.allocations.length">
                <td colspan="8" class="text-center text-slate-400 py-4">
                  暂无配货记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card p-4">
          <div class="font-semibold mb-2">赊销 & 回款</div>
          <table class="fruit">
            <thead>
              <tr>
                <th>客户</th>
                <th>金额</th>
                <th>已回款</th>
                <th>未结</th>
                <th>到期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in trace.sales" :key="s.id">
                <td>{{ s.customer_name }}</td>
                <td>¥{{ s.total_amount?.toFixed(0) }}</td>
                <td>¥{{ s.paid_amount?.toFixed(0) }}</td>
                <td class="text-rose-600">¥{{ s.balance?.toFixed(0) }}</td>
                <td class="text-xs">{{ s.due_date }}</td>
                <td>
                  <span :class="saleStatusColor(s.status)" class="tag">{{
                    s.status
                  }}</span>
                </td>
                <td>
                  <button
                    v-if="s.balance > 0"
                    class="text-brand-600 hover:underline"
                    @click="openPay(s)"
                  >
                    回款
                  </button>
                </td>
              </tr>
              <tr v-if="!trace.sales.length">
                <td colspan="7" class="text-center text-slate-400 py-4">
                  暂无赊销记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card p-4">
          <div class="font-semibold mb-2">回款记录</div>
          <table class="fruit">
            <thead>
              <tr>
                <th>日期</th>
                <th>方式</th>
                <th>金额</th>
                <th>操作人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in trace.payments" :key="p.id">
                <td class="text-xs">{{ p.paid_at?.slice(0, 10) }}</td>
                <td>
                  <span class="tag tag-blue">{{ p.method }}</span>
                </td>
                <td>¥{{ p.amount?.toFixed(2) }}</td>
                <td>{{ p.operator }}</td>
                <td class="text-xs text-slate-500">{{ p.remark }}</td>
              </tr>
              <tr v-if="!trace.payments.length">
                <td colspan="5" class="text-center text-slate-400 py-4">
                  暂无回款记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-4">
        <div class="card p-4">
          <div class="font-semibold mb-2">连续回查</div>
          <div class="text-xs text-slate-500 mb-2">
            同一进货单下，从过磅 → 分级 → 配货 → 赊销 → 回款 →
            异常，一条链看完。
          </div>
          <div class="space-y-2">
            <TraceStep label="过磅" :active="!!purchase" :done="!!purchase">
              <div class="text-xs text-slate-600">
                {{ purchase?.code }} · {{ purchase?.net_kg }} 斤
              </div>
            </TraceStep>
            <TraceStep
              label="分级"
              :active="trace.gradings.length > 0"
              :done="purchase && gradedDone"
            >
              <div
                v-if="trace.gradings.length"
                class="text-xs text-slate-600 space-y-0.5"
              >
                <div v-for="g in trace.gradings" :key="g.id">
                  {{ g.grade }}：{{ g.weight_kg }} 斤（{{
                    (g.ratio * 100).toFixed(0)
                  }}%）
                </div>
              </div>
            </TraceStep>
            <TraceStep
              label="配货"
              :active="trace.allocations.length > 0"
              :done="allocDone"
            >
              <div
                v-if="trace.allocations.length"
                class="text-xs text-slate-600 space-y-0.5"
              >
                <div v-for="a in trace.allocations" :key="a.id">
                  {{ a.customer_name }}·{{ a.grade }}·{{ a.qty_kg }}斤 [{{
                    a.status
                  }}]
                </div>
              </div>
            </TraceStep>
            <TraceStep
              label="赊销"
              :active="trace.sales.length > 0"
              :done="salesAllSettled"
            >
              <div
                v-if="trace.sales.length"
                class="text-xs text-slate-600 space-y-0.5"
              >
                <div v-for="s in trace.sales" :key="s.id">
                  {{ s.customer_name }}·余额 ¥{{ s.balance?.toFixed(0) }} [{{
                    s.status
                  }}]
                </div>
              </div>
            </TraceStep>
            <TraceStep
              label="回款"
              :active="trace.payments.length > 0"
              :done="salesAllSettled"
            >
              <div
                v-if="trace.payments.length"
                class="text-xs text-slate-600 space-y-0.5"
              >
                <div v-for="p in trace.payments" :key="p.id">
                  {{ p.method }}·¥{{ p.amount?.toFixed(0) }}·{{
                    p.paid_at?.slice(0, 10)
                  }}
                </div>
              </div>
              <div
                v-else-if="trace.sales.length > 0"
                class="text-xs text-slate-400"
              >
                暂无回款记录
              </div>
            </TraceStep>
            <TraceStep
              label="异常"
              :active="trace.exceptions.length > 0"
              :done="exceptionsAllClosed"
            >
              <div v-if="trace.exceptions.length" class="text-xs space-y-0.5">
                <div
                  v-for="e in trace.exceptions"
                  :key="e.id"
                  class="text-rose-600"
                >
                  {{ e.type }}·{{ e.title }}
                </div>
              </div>
            </TraceStep>
          </div>
        </div>

        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold">异常 / 客诉</div>
            <button class="btn-primary text-xs" @click="showException = true">
              登记
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="e in trace.exceptions"
              :key="e.id"
              class="border border-slate-200 rounded p-2 text-xs"
            >
              <div class="flex items-center justify-between">
                <span :class="typeColor(e.type)" class="tag">{{ e.type }}</span>
                <span :class="statusColor(e.status)" class="tag">{{
                  e.status
                }}</span>
              </div>
              <div class="font-medium mt-1">{{ e.title }}</div>
              <div class="text-slate-500 mt-0.5">{{ e.description }}</div>
              <div class="text-slate-500 mt-0.5">
                金额 ¥{{ e.amount?.toFixed(0) }} · 处理人 {{ e.handler }}
              </div>
              <div class="mt-1 flex gap-2">
                <button
                  v-if="e.status !== '已处理'"
                  class="text-brand-600 hover:underline"
                  @click="markException(e.id, '已处理')"
                >
                  标记已处理
                </button>
              </div>
            </div>
            <div v-if="!trace.exceptions.length" class="text-sm text-slate-400">
              暂无异常
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grading Modal -->
    <div
      v-if="showGrading"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[460px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">新增分级</div>
          <button class="btn-ghost" @click="showGrading = false">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">等级</label>
            <select v-model="gradingForm.grade" class="input">
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>损耗</option>
            </select>
          </div>
          <div>
            <label class="label">重量(斤)</label>
            <input
              v-model="gradingForm.weight_kg"
              type="number"
              class="input"
            />
          </div>
          <div class="col-span-2">
            <label class="label">备注</label>
            <input v-model="gradingForm.remark" class="input" />
          </div>
        </div>
        <div class="text-xs text-slate-500 mt-2">
          剩余可分级：{{ remainingGradable.toFixed(0) }} 斤
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showGrading = false">取消</button>
          <button class="btn-primary" @click="createGrading">保存</button>
        </div>
      </div>
    </div>

    <!-- Allocation Modal -->
    <div
      v-if="showAllocation"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[520px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">新增配货</div>
          <button class="btn-ghost" @click="showAllocation = false">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">客户</label>
            <select v-model="allocForm.customer_id" class="input">
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.name }}（{{ c.stall_code }}）
              </option>
            </select>
          </div>
          <div>
            <label class="label">等级</label>
            <select v-model="allocForm.grade" class="input">
              <option v-for="g in gradedGrades" :key="g" :value="g">
                {{ g }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">数量(斤)</label>
            <input v-model="allocForm.qty_kg" type="number" class="input" />
          </div>
          <div>
            <label class="label">单价(元/斤)</label>
            <input
              v-model="allocForm.unit_price"
              type="number"
              step="0.1"
              class="input"
            />
          </div>
          <div class="col-span-2">
            <label class="label">备注</label>
            <input v-model="allocForm.remark" class="input" />
          </div>
        </div>
        <div class="text-xs text-slate-500 mt-2">
          等级 {{ allocForm.grade }} 剩余可配：{{
            remainingAllocable.toFixed(0)
          }}
          斤
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showAllocation = false">
            取消
          </button>
          <button class="btn-primary" @click="createAllocation">
            保存并生成赊销单
          </button>
        </div>
      </div>
    </div>

    <!-- Pay Modal -->
    <div
      v-if="showPay"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[400px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">登记回款</div>
          <button class="btn-ghost" @click="showPay = false">×</button>
        </div>
        <div class="text-sm text-slate-600 mb-2">
          未结余额：<span class="text-rose-600 font-bold"
            >¥{{ currentPaySale?.balance?.toFixed(2) }}</span
          >
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">金额</label>
            <input v-model="payForm.amount" type="number" class="input" />
          </div>
          <div>
            <label class="label">方式</label>
            <select v-model="payForm.method" class="input">
              <option>现金</option>
              <option>微信</option>
              <option>转账</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="label">备注</label
            ><input v-model="payForm.remark" class="input" />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showPay = false">取消</button>
          <button class="btn-primary" @click="submitPay">保存</button>
        </div>
      </div>
    </div>

    <!-- Exception Modal -->
    <div
      v-if="showException"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[520px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">登记异常</div>
          <button class="btn-ghost" @click="showException = false">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">类型</label>
            <select v-model="excForm.type" class="input">
              <option>损耗</option>
              <option>客诉</option>
              <option>赔付</option>
              <option>回款逾期</option>
            </select>
          </div>
          <div>
            <label class="label">关联</label>
            <select v-model="excForm.related_type" class="input">
              <option value="purchase">进货单</option>
              <option
                v-for="a in trace.allocations"
                :key="'a' + a.id"
                :value="`allocation|${a.id}`"
              >
                配货 {{ a.customer_name }} {{ a.grade }}
              </option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="label">标题</label
            ><input v-model="excForm.title" class="input" />
          </div>
          <div class="col-span-2">
            <label class="label">描述</label
            ><textarea
              v-model="excForm.description"
              class="input"
              rows="2"
            ></textarea>
          </div>
          <div class="col-span-2">
            <label class="label">证据（单号/说明）</label
            ><input v-model="excForm.evidence" class="input" />
          </div>
          <div>
            <label class="label">金额</label
            ><input v-model="excForm.amount" type="number" class="input" />
          </div>
          <div>
            <label class="label">处理人</label
            ><input v-model="excForm.handler" class="input" />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showException = false">取消</button>
          <button class="btn-primary" @click="createException">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
const route = useRoute();
const api = useApi();

const purchase = ref<any>(null);
const trace = ref<any>({
  gradings: [],
  allocations: [],
  sales: [],
  payments: [],
  exceptions: [],
});
const customers = ref<any[]>([]);

const showGrading = ref(false);
const gradingForm = reactive({ grade: "A", weight_kg: 0, remark: "" });

const showAllocation = ref(false);
const allocForm = reactive({
  customer_id: 0,
  grade: "",
  qty_kg: 0,
  unit_price: 0,
  remark: "",
});

const showPay = ref(false);
const currentPaySale = ref<any>(null);
const payForm = reactive({ amount: 0, method: "现金", remark: "" });

const showException = ref(false);
const excForm = reactive({
  type: "损耗",
  related_type: "purchase",
  title: "",
  description: "",
  evidence: "",
  amount: 0,
  handler: "",
});

const pid = computed(() => Number(route.params.id));

async function load() {
  purchase.value = await api(`/purchases/${pid.value}`);
  trace.value = await api(`/review/trace/${pid.value}`);
}

const remainingGradable = computed(() => {
  if (!purchase.value) return 0;
  const g = trace.value.gradings.reduce(
    (s: number, x: any) => s + Number(x.weight_kg),
    0,
  );
  return Number(purchase.value.net_kg) - g;
});

const gradedGrades = computed(() => {
  const set = new Set(trace.value.gradings.map((g: any) => g.grade));
  return Array.from(set);
});

const remainingAllocable = computed(() => {
  const g = trace.value.gradings
    .filter((x: any) => x.grade === allocForm.grade)
    .reduce((s: number, x: any) => s + Number(x.weight_kg), 0);
  const a = trace.value.allocations
    .filter((x: any) => x.grade === allocForm.grade && x.status !== "已退货")
    .reduce((s: number, x: any) => s + Number(x.qty_kg), 0);
  return g - a;
});

const gradedDone = computed(() => remainingGradable.value === 0);
const allocDone = computed(() => {
  const g = trace.value.gradings
    .filter((x: any) => x.grade !== "损耗")
    .reduce((s: number, x: any) => s + Number(x.weight_kg), 0);
  const a = trace.value.allocations
    .filter((x: any) => x.status !== "已退货")
    .reduce((s: number, x: any) => s + Number(x.qty_kg), 0);
  return g > 0 && g - a <= 0;
});
const salesAllSettled = computed(
  () =>
    trace.value.sales.length > 0 &&
    trace.value.sales.every((s: any) => s.status === "已结清"),
);
const exceptionsAllClosed = computed(
  () =>
    trace.value.exceptions.length === 0 ||
    trace.value.exceptions.every((e: any) => e.status === "已处理"),
);

onMounted(async () => {
  customers.value = (await api("/base/customers")) as any[];
  if (customers.value[0]) allocForm.customer_id = customers.value[0].id;
  load();
});

async function createGrading() {
  if (!gradingForm.weight_kg) return alert("请填写重量");
  try {
    await api("/gradings", {
      method: "POST",
      body: { purchase_id: pid.value, ...gradingForm },
    });
    showGrading.value = false;
    gradingForm.weight_kg = 0;
    gradingForm.remark = "";
    load();
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}

async function delGrading(id: number) {
  if (!confirm("确认删除该分级记录？")) return;
  await api(`/gradings/${id}`, { method: "DELETE" });
  load();
}

async function createAllocation() {
  if (!allocForm.customer_id || !allocForm.grade || !allocForm.qty_kg)
    return alert("请填写完整");
  try {
    const a = (await api("/allocations", {
      method: "POST",
      body: { purchase_id: pid.value, ...allocForm },
    })) as any;
    await api("/sales", { method: "POST", body: { allocation_id: a.id } });
    showAllocation.value = false;
    allocForm.grade = "";
    allocForm.qty_kg = 0;
    allocForm.unit_price = 0;
    allocForm.remark = "";
    load();
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}

async function updateAllocStatus(id: number, status: string) {
  if (!confirm(`标记为 ${status}？`)) return;
  await api(`/allocations/${id}/status`, { method: "PATCH", body: { status } });
  load();
}

function openPay(s: any) {
  currentPaySale.value = s;
  payForm.amount = s.balance;
  showPay.value = true;
}

async function submitPay() {
  if (!payForm.amount) return;
  try {
    await api(`/sales/${currentPaySale.value.id}/pay`, {
      method: "POST",
      body: payForm,
    });
    showPay.value = false;
    load();
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}

async function createException() {
  if (!excForm.title) return alert("请填写标题");
  let related_type = excForm.related_type;
  let related_id = pid.value;
  if (related_type.startsWith("allocation|")) {
    related_id = Number(related_type.split("|")[1]);
    related_type = "allocation";
  }
  try {
    await api("/exceptions", {
      method: "POST",
      body: { ...excForm, related_type, related_id },
    });
    showException.value = false;
    Object.assign(excForm, {
      title: "",
      description: "",
      evidence: "",
      amount: 0,
      handler: "",
    });
    load();
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}

async function markException(id: number, status: string) {
  await api(`/exceptions/${id}/status`, {
    method: "PATCH",
    body: { status, remark: "在回查面板处理" },
  });
  load();
}

function gradeColor(g: string) {
  if (g === "A") return "tag-green";
  if (g === "B") return "tag-blue";
  if (g === "C") return "tag-slate";
  return "tag-red";
}
function allocStatusColor(s: string) {
  if (s === "已提货") return "tag-green";
  if (s === "已退货") return "tag-red";
  return "tag-amber";
}
function saleStatusColor(s: string) {
  if (s === "已结清") return "tag-green";
  if (s === "逾期") return "tag-red";
  if (s === "部分回款") return "tag-blue";
  return "tag-amber";
}
function typeColor(t: string) {
  return t === "损耗"
    ? "tag-red"
    : t === "客诉"
      ? "tag-amber"
      : t === "赔付"
        ? "tag-blue"
        : "tag-slate";
}
function statusColor(s: string) {
  return s === "已处理"
    ? "tag-green"
    : s === "处理中"
      ? "tag-amber"
      : "tag-red";
}
</script>
