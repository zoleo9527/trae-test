<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">异常回查</h1>
      <div class="flex gap-2">
        <select v-model="filterType" class="input w-28">
          <option value="">全部类型</option>
          <option>损耗</option>
          <option>客诉</option>
          <option>赔付</option>
          <option>回款逾期</option>
        </select>
        <select v-model="filterStatus" class="input w-28">
          <option value="">全部状态</option>
          <option>待处理</option>
          <option>处理中</option>
          <option>已处理</option>
          <option>已驳回</option>
        </select>
        <button
          v-if="auth.canManageExceptions"
          class="btn-primary"
          @click="showCreate = true"
        >
          登记异常
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="fruit">
        <thead>
          <tr>
            <th>类型</th>
            <th>标题</th>
            <th>关联</th>
            <th>金额</th>
            <th>处理人</th>
            <th>状态</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id">
            <td>
              <span :class="typeColor(e.type)" class="tag">{{ e.type }}</span>
            </td>
            <td>
              <div class="font-medium">{{ e.title }}</div>
              <div class="text-xs text-slate-500">{{ e.description }}</div>
              <div v-if="e.evidence" class="text-xs text-slate-400 mt-0.5">
                证据：{{ e.evidence }}
              </div>
            </td>
            <td class="text-xs">{{ e.related_type }} #{{ e.related_id }}</td>
            <td>¥{{ e.amount?.toFixed(0) }}</td>
            <td>{{ e.handler }}</td>
            <td>
              <span :class="statusColor(e.status)" class="tag">{{
                e.status
              }}</span>
            </td>
            <td class="text-xs">{{ e.created_at }}</td>
            <td class="space-x-2 text-xs">
              <button
                v-if="auth.canManageExceptions && e.status !== '已处理'"
                class="text-brand-600 hover:underline"
                @click="mark(e.id, '已处理')"
              >
                已处理
              </button>
              <button
                v-if="auth.canManageExceptions"
                class="text-rose-600 hover:underline"
                @click="del(e.id)"
              >
                删除
              </button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="8" class="text-center text-slate-400 py-6">
              暂无记录
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[520px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">登记异常</div>
          <button class="btn-ghost" @click="showCreate = false">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">类型</label>
            <select v-model="form.type" class="input">
              <option>损耗</option>
              <option>客诉</option>
              <option>赔付</option>
              <option>回款逾期</option>
            </select>
          </div>
          <div>
            <label class="label">关联类型</label>
            <select v-model="form.related_type" class="input">
              <option value="purchase">进货单</option>
              <option value="allocation">配货单</option>
              <option value="sale">赊销单</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="label">关联 ID</label>
            <input v-model="form.related_id" type="number" class="input" />
          </div>
          <div class="col-span-2">
            <label class="label">标题</label
            ><input v-model="form.title" class="input" />
          </div>
          <div class="col-span-2">
            <label class="label">描述</label
            ><textarea
              v-model="form.description"
              class="input"
              rows="2"
            ></textarea>
          </div>
          <div class="col-span-2">
            <label class="label">证据</label
            ><input v-model="form.evidence" class="input" />
          </div>
          <div>
            <label class="label">金额</label
            ><input v-model="form.amount" type="number" class="input" />
          </div>
          <div>
            <label class="label">处理人</label
            ><input v-model="form.handler" class="input" />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="create">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
const auth = useAuthStore();
const api = useApi();
const all = ref<any[]>([]);
const filterType = ref("");
const filterStatus = ref("");
const showCreate = ref(false);
const form = reactive({
  type: "损耗",
  related_type: "purchase",
  related_id: 0,
  title: "",
  description: "",
  evidence: "",
  amount: 0,
  handler: "",
});

const filtered = computed(() =>
  all.value.filter((e: any) => {
    if (filterType.value && e.type !== filterType.value) return false;
    if (filterStatus.value && e.status !== filterStatus.value) return false;
    return true;
  }),
);

onMounted(load);

async function load() {
  all.value = (await api("/exceptions")) as any[];
}

async function create() {
  if (!form.title) return alert("请填写标题");
  if (!form.related_id) return alert("请填写关联 ID");
  try {
    await api("/exceptions", { method: "POST", body: form });
    showCreate.value = false;
    Object.assign(form, {
      title: "",
      description: "",
      evidence: "",
      amount: 0,
      related_id: 0,
    });
    load();
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}

async function mark(id: number, status: string) {
  await api(`/exceptions/${id}/status`, {
    method: "PATCH",
    body: { status, remark: "从异常回查页面更新" },
  });
  load();
}

async function del(id: number) {
  if (!confirm("删除该异常记录？")) return;
  await api(`/exceptions/${id}`, { method: "DELETE" });
  load();
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
