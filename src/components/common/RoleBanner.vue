<template>
  <el-alert
    v-if="visible"
    type="info"
    :closable="false"
    style="margin-bottom: 16px"
  >
    <template #title>
      <span>
        当前以
        <el-tag
          size="small"
          type="primary"
          effect="plain"
          style="margin: 0 6px"
          >{{ roleLabel }}</el-tag
        >
        视角查看数据，可通过右上角切换角色。
      </span>
    </template>
  </el-alert>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConsoleStore } from "@/stores/console";

const store = useConsoleStore();

const visible = computed(() => true);
const roleLabel = computed(() => {
  const map = {
    channel: "渠道经理",
    issuer: "发行专员",
    finance: "财务对接",
  } as const;
  return map[store.role];
});
</script>
