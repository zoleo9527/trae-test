<script setup lang="ts">
import { computed } from "vue";
import { useEvidence } from "@/composables/useEvidence";
import { Paperclip } from "lucide-vue-next";

const props = defineProps<{ orderId: string; title?: string }>();
const { timelineFor } = useEvidence();
const items = computed(() => timelineFor(props.orderId));

const colorMap: Record<string, string> = {
  moss: "bg-moss-500/90 shadow-[0_0_0_3px_rgba(31,107,90,0.18)]",
  amber: "bg-amber2-500/90 shadow-[0_0_0_3px_rgba(201,139,46,0.18)]",
  rose: "bg-rose-500/80 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
  sky: "bg-sky-500/80 shadow-[0_0_0_3px_rgba(56,189,248,0.18)]",
  violet: "bg-violet-500/80 shadow-[0_0_0_3px_rgba(139,92,246,0.18)]",
  slate: "bg-slate-400/80 shadow-[0_0_0_3px_rgba(148,163,184,0.18)]",
};
</script>

<template>
  <div class="card-soft p-4">
    <div class="flex items-baseline justify-between mb-3">
      <div class="section-title">{{ title ?? "证据链 · 时间线" }}</div>
      <div class="mono">共 {{ items.length }} 条</div>
    </div>
    <ol class="relative">
      <div class="absolute left-[7px] top-1 bottom-1 w-px bg-white/10"></div>
      <li
        v-for="(it, idx) in items"
        :key="it.id"
        class="relative pl-6 pb-3 last:pb-0"
      >
        <div
          class="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full"
          :class="colorMap[it.color]"
        ></div>
        <div class="flex items-baseline gap-2">
          <div class="mono">{{ it.time }}</div>
          <div class="text-[12px] text-paper/60">{{ it.title }}</div>
        </div>
        <div class="text-sm text-paper/85 leading-relaxed">{{ it.desc }}</div>
        <div v-if="it.actor" class="mono mt-0.5">操作人：{{ it.actor }}</div>
        <div
          v-if="it.attach"
          class="inline-flex items-center gap-1 mt-1 tag border-white/10 text-paper/80"
        >
          <Paperclip class="w-3 h-3" /> {{ it.attach }}
        </div>
      </li>
    </ol>
  </div>
</template>
