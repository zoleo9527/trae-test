<template>
  <div v-if="entries.length">
    <div v-for="e in entries" :key="e.id" class="history-line">
      <div class="dot" :style="{ background: colorFor(e.role) }"></div>
      <div class="meta">
        <div>
          <el-tag
            size="small"
            :type="tagFor(e.role)"
            style="margin-right: 6px"
            >{{ roleFor(e.role) }}</el-tag
          >
          <strong>{{ e.operator }}</strong>
          <span style="margin-left: 8px">{{ e.action }}</span>
        </div>
        <div style="margin-top: 4px">
          <span v-if="e.from">状态: {{ e.from }} → {{ e.to }}</span>
          <span v-if="e.from && e.comment"> · </span>
          <span v-if="e.comment">{{ e.comment }}</span>
        </div>
        <div
          style="color: var(--app-sub-text); margin-top: 4px; font-size: 12px"
        >
          {{ e.timestamp }}
        </div>
      </div>
    </div>
  </div>
  <EmptyBlock v-else text="暂无操作留痕" />
</template>

<script setup lang="ts">
import type { HistoryEntry, Role } from "@/types/domain";
import EmptyBlock from "@/components/common/EmptyBlock.vue";

defineProps<{ entries: HistoryEntry[] }>();

function roleFor(role: Role) {
  return { channel: "渠道", issuer: "发行", finance: "财务" }[role] || role;
}

function tagFor(role: Role) {
  return (
    ({ channel: "success", issuer: "primary", finance: "warning" } as const)[
      role
    ] || "info"
  );
}

function colorFor(role: Role) {
  return (
    ({ channel: "#27c281", issuer: "#3a6df0", finance: "#f5a623" } as const)[
      role
    ] || "#999"
  );
}
</script>
