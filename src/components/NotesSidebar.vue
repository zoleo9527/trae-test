<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore } from "@/store/app";
import { useEvidence } from "@/composables/useEvidence";
import { Search, Filter } from "lucide-vue-next";

const props = defineProps<{ orderId: string }>();
const emit = defineEmits<{ (e: "select", id: string): void }>();
const store = useAppStore();
const { timelineFor } = useEvidence();

const search = ref("");
const filterKind = ref<string>("all");

const items = computed(() => {
  const all = store.notesOf(props.orderId);
  return all.filter((n) => {
    const kindOk = filterKind.value === "all" || n.kind === filterKind.value;
    const searchOk =
      !search.value ||
      n.content.includes(search.value) ||
      n.actor.includes(search.value);
    return kindOk && searchOk;
  });
});

const kindChip = (k: string) =>
  (
    ({
      note: "备注",
      reject: "驳回",
      supplement: "补录",
      evidence: "证据",
    }) as any
  )[k] ?? k;
</script>

<template>
  <div class="card-soft p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="section-title">历史备注</div>
      <div class="mono">{{ items.length }} 条</div>
    </div>
    <div class="flex items-center gap-2 mb-3">
      <div class="relative flex-1">
        <Search
          class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-paper/40"
        />
        <input
          v-model="search"
          class="input pl-8"
          placeholder="搜索内容 / 操作人"
        />
      </div>
      <select v-model="filterKind" class="input w-28">
        <option value="all">全部</option>
        <option value="note">备注</option>
        <option value="reject">驳回</option>
        <option value="supplement">补录</option>
        <option value="evidence">证据</option>
      </select>
    </div>
    <ul class="space-y-2">
      <li
        v-for="n in items"
        :key="n.id"
        class="rounded-xl border border-white/10 bg-ink-900/40 p-3 hover:border-white/20 transition"
      >
        <div class="flex items-center gap-2">
          <span class="tag border-white/10 text-paper/70">{{
            kindChip(n.kind)
          }}</span>
          <span class="mono">{{ n.createdAt }}</span>
          <span class="ml-auto mono text-paper/50">{{ n.actor }}</span>
        </div>
        <div class="mt-1 text-sm text-paper/85 leading-relaxed">
          {{ n.content }}
        </div>
        <div v-if="n.attach" class="mt-1 mono text-paper/60">
          附件：{{ n.attach }}
        </div>
      </li>
      <li v-if="items.length === 0" class="text-sm text-paper/50">
        暂无匹配记录
      </li>
    </ul>
  </div>
</template>
