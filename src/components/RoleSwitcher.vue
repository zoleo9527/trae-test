<script setup lang="ts">
import { useAppStore, roleLabel } from "@/store/app";
import { UserCog, Eye, Factory, Headphones, Check } from "lucide-vue-next";
import type { Role } from "@/types";

const store = useAppStore();

const roles: Array<{ key: Role; icon: any; label: string }> = [
  { key: "manager", icon: UserCog, label: "店经理" },
  { key: "optometrist", icon: Eye, label: "验光师" },
  { key: "workshop", icon: Factory, label: "加工跟单" },
  { key: "service", icon: Headphones, label: "售后专员" },
];

function setRole(r: Role) {
  store.switchRole(r);
}
</script>

<template>
  <div
    class="flex items-center gap-1 rounded-xl border border-white/10 bg-ink-800/70 p-1"
  >
    <button
      v-for="r in roles"
      :key="r.key"
      class="relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition"
      :class="
        store.currentRole === r.key
          ? 'bg-moss-500 text-white shadow-soft'
          : 'text-paper/70 hover:text-paper hover:bg-white/5'
      "
      @click="setRole(r.key)"
      :title="`切换为${r.label}视图`"
    >
      <component :is="r.icon" class="w-4 h-4" />
      <span>{{ r.label }}</span>
      <Check
        v-if="store.currentRole === r.key"
        class="w-3.5 h-3.5 opacity-80"
      />
    </button>
  </div>
</template>
