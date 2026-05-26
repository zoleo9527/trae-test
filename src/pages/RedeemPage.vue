<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { useAppStore, statusLabel } from "@/store/app";
import { QrCode, ScanLine, Package2, Eye, Save, Plus, Edit3, Check } from "lucide-vue-next";
import EvidenceTimeline from "@/components/EvidenceTimeline.vue";
import NotesSidebar from "@/components/NotesSidebar.vue";
import type { EyeRx } from "@/types";

const store = useAppStore();

const scanInput = ref("");
const selectedId = ref<string>(store.selectedOrderId);
const order = computed(() => store.orderById(selectedId.value));
const customer = computed(() =>
  order.value ? store.customerOf(order.value) : undefined,
);
const pkg = computed(() =>
  order.value ? store.pkgOf(order.value) : undefined,
);
const rx = computed(() =>
  order.value ? store.rxOf(order.value.id) : undefined,
);

const editingRx = ref(false);
const rxForm = reactive({
  od: { sphere: 0, cylinder: 0, axis: 0, add: undefined as number | undefined } as EyeRx,
  os: { sphere: 0, cylinder: 0, axis: 0, add: undefined as number | undefined } as EyeRx,
  pd: 62,
  note: "",
});

function startEditRx() {
  if (rx.value) {
    rxForm.od = { ...rx.value.od };
    rxForm.os = { ...rx.value.os };
    rxForm.pd = rx.value.pd;
    rxForm.note = rx.value.note || "";
  } else {
    rxForm.od = { sphere: 0, cylinder: 0, axis: 0 };
    rxForm.os = { sphere: 0, cylinder: 0, axis: 0 };
    rxForm.pd = 62;
    rxForm.note = "";
  }
  editingRx.value = true;
}

function saveRx() {
  if (!order.value || !store.currentActor) return;
  store.saveRx(order.value.id, {
    od: rxForm.od,
    os: rxForm.os,
    pd: rxForm.pd,
    note: rxForm.note || undefined,
    measuredBy: store.currentActor.name,
  });
  editingRx.value = false;
}

const recentCodes = computed(() => store.orders.value.map((o) => o.code));

function scan() {
  const v = scanInput.value.trim();
  if (!v) return;
  const hit = store.orders.value.find((o) => o.code === v || o.id === v);
  if (hit) {
    selectedId.value = hit.id;
    store.selectedOrderId = hit.id;
    editingRx.value = false;
  }
  scanInput.value = "";
}

function selectOrder(id: string) {
  selectedId.value = id;
  store.selectedOrderId = id;
  editingRx.value = false;
}

const noteContent = ref("");
function appendNote() {
  if (!order.value || !noteContent.value.trim() || !store.currentActor) return;
  store.addNote({
    orderId: order.value.id,
    kind: "note",
    role: store.currentActor.role,
    actor: store.currentActor.name,
    content: noteContent.value.trim(),
  });
  noteContent.value = "";
}

function redeem() {
  if (!order.value) return;
  store.redeemOrder(order.value.id);
}

const canRedeem = computed(() => {
  if (!order.value) return false;
  if (order.value.status !== "pending") return false;
  if (store.currentRole === "optometrist" || store.currentRole === "manager") return true;
  return false;
});

const canEditRx = computed(() => {
  return store.currentRole === "optometrist" || store.currentRole === "manager";
});
</script>

<template>
  <div class="p-6 grid grid-cols-[220px_minmax(0,1fr)_360px] gap-5 h-full">
    <aside class="card-soft p-3 flex flex-col gap-2 overflow-auto">
      <div class="px-2 py-1 mono text-paper/60">订单列表</div>
      <button
        v-for="o in store.orders.value"
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
      <div class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <QrCode class="w-5 h-5 text-moss-500" />
          <div class="section-title">扫码核销</div>
          <div class="ml-auto mono">演示模式：输入订单号模拟扫码</div>
        </div>
        <div class="grid grid-cols-[1fr_auto] gap-3">
          <div
            class="relative rounded-2xl border border-dashed border-white/15 bg-ink-900/60 overflow-hidden"
          >
            <div class="absolute inset-0 grid-bg opacity-40"></div>
            <div class="relative p-6">
              <div class="flex items-center gap-2 mb-3">
                <ScanLine class="w-4 h-4 text-amber2-500" />
                <div class="mono">扫码枪已就绪 · 光标在输入框即可</div>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="scanInput"
                  class="input text-lg tracking-widest font-mono"
                  placeholder="输入或扫码订单号，如 SO250518-0017"
                  @keyup.enter="scan"
                />
                <button class="btn-primary" @click="scan">
                  <QrCode class="w-4 h-4" /> 扫码识别
                </button>
              </div>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <span class="mono text-paper/50 mr-1">最近：</span>
                <button
                  v-for="c in recentCodes"
                  :key="c"
                  class="mono rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                  @click="scanInput = c"
                >
                  {{ c }}
                </button>
              </div>
            </div>
            <div
              class="h-[2px] w-full bg-gradient-to-r from-transparent via-moss-500 to-transparent animate-scanline"
            ></div>
          </div>
        </div>
      </div>

      <div v-if="order" class="grid grid-cols-2 gap-4">
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <Package2 class="w-4 h-4 text-moss-500" />
            <div class="section-title">套餐与订单</div>
          </div>
          <dl class="grid grid-cols-2 gap-y-2 text-sm">
            <dt class="mono text-paper/50">订单号</dt>
            <dd class="font-mono">{{ order.code }}</dd>
            <dt class="mono text-paper/50">顾客</dt>
            <dd>{{ customer?.name }} · {{ customer?.phone }}</dd>
            <dt class="mono text-paper/50">会员号</dt>
            <dd>{{ customer?.memberNo }}</dd>
            <dt class="mono text-paper/50">套餐</dt>
            <dd>{{ pkg?.name }}</dd>
            <dt class="mono text-paper/50">镜片</dt>
            <dd>{{ pkg?.lensType }}</dd>
            <dt class="mono text-paper/50">镜架</dt>
            <dd>{{ pkg?.frameIncluded ? "套餐含" : "另购" }}</dd>
            <dt class="mono text-paper/50">金额</dt>
            <dd class="text-amber2-500 font-semibold">¥{{ pkg?.price }}</dd>
            <dt class="mono text-paper/50">状态</dt>
            <dd>
              <span class="tag border-white/10">{{
                statusLabel[order.status]
              }}</span>
            </dd>
          </dl>
          <div class="mt-4 flex items-center gap-2">
            <button
              class="btn-primary"
              :disabled="!canRedeem"
              @click="redeem"
              :title="!canRedeem ? '仅验光师和店经理可核销' : ''"
            >
              <ScanLine class="w-4 h-4" /> 核销此套餐
            </button>
            <span class="mono text-paper/50">核销后进入加工队列</span>
          </div>
        </div>

        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <Eye class="w-4 h-4 text-amber2-500" />
            <div class="section-title">验光数据</div>
            <button
              v-if="!editingRx && canEditRx"
              class="btn-ghost ml-auto text-xs py-1 px-2"
              @click="startEditRx"
            >
              <Edit3 class="w-3.5 h-3.5" /> {{ rx ? '修改' : '录入' }}
            </button>
            <button
              v-if="editingRx"
              class="btn-primary ml-auto text-xs py-1 px-2"
              @click="saveRx"
            >
              <Check class="w-3.5 h-3.5" /> 保存
            </button>
          </div>

          <div v-if="rx && !editingRx" class="grid grid-cols-2 gap-3 text-sm">
            <div class="card-soft p-3">
              <div class="mono">右眼 OD</div>
              <div class="mt-1">
                球镜 {{ rx.od.sphere }}　柱镜 {{ rx.od.cylinder }}　轴位
                {{ rx.od.axis }}
              </div>
              <div v-if="rx.od.add" class="mono mt-1">ADD {{ rx.od.add }}</div>
            </div>
            <div class="card-soft p-3">
              <div class="mono">左眼 OS</div>
              <div class="mt-1">
                球镜 {{ rx.os.sphere }}　柱镜 {{ rx.os.cylinder }}　轴位
                {{ rx.os.axis }}
              </div>
              <div v-if="rx.os.add" class="mono mt-1">ADD {{ rx.os.add }}</div>
            </div>
            <div class="card-soft p-3">
              <div class="mono">瞳距 PD</div>
              <div class="mt-1">{{ rx.pd }} mm</div>
            </div>
            <div class="card-soft p-3">
              <div class="mono">验光师 / 时间</div>
              <div class="mt-1">{{ rx.measuredBy }} · {{ rx.measuredAt }}</div>
            </div>
            <div class="col-span-2 card-soft p-3">
              <div class="mono">备注</div>
              <div class="mt-1 text-sm text-paper/85">{{ rx.note ?? "—" }}</div>
            </div>
          </div>

          <div v-if="editingRx" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="card-soft p-3">
                <div class="mono mb-2">右眼 OD</div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <div class="mono text-paper/50 text-xs">球镜</div>
                    <input v-model.number="rxForm.od.sphere" class="input text-sm" type="number" step="0.25" />
                  </div>
                  <div>
                    <div class="mono text-paper/50 text-xs">柱镜</div>
                    <input v-model.number="rxForm.od.cylinder" class="input text-sm" type="number" step="0.25" />
                  </div>
                  <div>
                    <div class="mono text-paper/50 text-xs">轴位</div>
                    <input v-model.number="rxForm.od.axis" class="input text-sm" type="number" min="0" max="180" />
                  </div>
                </div>
                <div class="mt-2">
                  <div class="mono text-paper/50 text-xs">ADD（渐进用）</div>
                  <input v-model.number="rxForm.od.add" class="input text-sm" type="number" step="0.25" placeholder="可选" />
                </div>
              </div>
              <div class="card-soft p-3">
                <div class="mono mb-2">左眼 OS</div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <div class="mono text-paper/50 text-xs">球镜</div>
                    <input v-model.number="rxForm.os.sphere" class="input text-sm" type="number" step="0.25" />
                  </div>
                  <div>
                    <div class="mono text-paper/50 text-xs">柱镜</div>
                    <input v-model.number="rxForm.os.cylinder" class="input text-sm" type="number" step="0.25" />
                  </div>
                  <div>
                    <div class="mono text-paper/50 text-xs">轴位</div>
                    <input v-model.number="rxForm.os.axis" class="input text-sm" type="number" min="0" max="180" />
                  </div>
                </div>
                <div class="mt-2">
                  <div class="mono text-paper/50 text-xs">ADD（渐进用）</div>
                  <input v-model.number="rxForm.os.add" class="input text-sm" type="number" step="0.25" placeholder="可选" />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="card-soft p-3">
                <div class="mono mb-1">瞳距 PD (mm)</div>
                <input v-model.number="rxForm.pd" class="input text-sm" type="number" min="50" max="75" />
              </div>
              <div class="card-soft p-3">
                <div class="mono mb-1">验光师</div>
                <div class="input text-sm bg-ink-800/40">
                  {{ store.currentActor?.name }}
                </div>
              </div>
            </div>
            <div class="card-soft p-3">
              <div class="mono mb-1">备注</div>
              <textarea v-model="rxForm.note" class="input text-sm min-h-[60px] resize-none" placeholder="顾客用眼习惯、佩戴要求等"></textarea>
            </div>
          </div>

          <div v-if="!rx && !editingRx" class="text-sm text-paper/50">
            此订单暂无验光记录
            <span v-if="canEditRx">，点击右上角「录入」开始</span>
            <span v-else>，请联系验光师录入</span>
          </div>
        </div>
      </div>

      <div v-if="order" class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <Plus class="w-4 h-4 text-moss-500" />
          <div class="section-title">追加备注 / 补录说明</div>
          <div class="ml-auto mono text-paper/50">将作为证据链沉淀</div>
        </div>
        <div class="flex items-start gap-2">
          <textarea
            v-model="noteContent"
            class="input min-h-[80px] resize-none"
            placeholder="写下这次沟通的关键信息，让后面的人不用再去群里翻。"
          ></textarea>
          <button class="btn-primary" @click="appendNote">
            <Save class="w-4 h-4" /> 保存
          </button>
        </div>
      </div>
    </section>

    <aside class="flex flex-col gap-4 min-w-0">
      <NotesSidebar v-if="order" :order-id="order.id" />
      <EvidenceTimeline
        v-if="order"
        :order-id="order.id"
        title="该订单证据链"
      />
    </aside>
  </div>
</template>
