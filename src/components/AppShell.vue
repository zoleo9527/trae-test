<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import {
  LayoutDashboard,
  QrCode,
  Factory,
  FileWarning,
  History,
  CircleUser,
} from "lucide-vue-next";
import { useAppStore, roleLabel } from "@/store/app";
import RoleSwitcher from "@/components/RoleSwitcher.vue";

const store = useAppStore();
const route = useRoute();

const navItems = [
  { to: "/", label: "工作台", icon: LayoutDashboard },
  { to: "/redeem", label: "套餐核销", icon: QrCode },
  { to: "/workshop", label: "加工与返修", icon: Factory },
  { to: "/refund", label: "退款复核", icon: FileWarning },
  { to: "/history", label: "历史回看", icon: History },
];

const isActive = (to: string) => route.path === to;

const headline = computed(() => {
  const map: Record<string, string> = {
    "/": "门店工作台",
    "/redeem": "套餐核销与扫码录入",
    "/workshop": "加工、调拨与返修",
    "/refund": "退款复核",
    "/history": "历史回看",
  };
  return map[route.path] ?? "控制台";
});
</script>

<template>
  <div class="min-h-full flex">
    <aside
      class="w-60 shrink-0 border-r border-white/10 bg-ink-900/60 backdrop-blur flex flex-col"
    >
      <div class="px-5 py-5 flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl bg-moss-500/90 grid place-items-center shadow-soft"
        >
          <span class="font-display text-paper">O</span>
        </div>
        <div>
          <div class="font-display text-base tracking-wide text-paper">
            眼镜连锁
          </div>
          <div class="mono">核销 · 复核 · 回看</div>
        </div>
      </div>

      <nav class="px-3 flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
          :class="
            isActive(item.to)
              ? 'bg-white/5 text-paper ring-1 ring-white/10'
              : 'text-paper/70 hover:bg-white/5 hover:text-paper'
          "
        >
          <component
            :is="item.icon"
            class="w-4 h-4"
            :class="
              isActive(item.to)
                ? 'text-moss-500'
                : 'text-paper/50 group-hover:text-paper/80'
            "
          />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="mt-auto px-4 py-4 border-t border-white/10">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-ink-700 grid place-items-center ring-1 ring-white/10"
          >
            <CircleUser class="w-4 h-4 text-paper/80" />
          </div>
          <div>
            <div class="text-sm text-paper/90">
              {{ store.currentActor?.name }}
            </div>
            <div class="mono">
              {{ roleLabel[store.currentRole] }} ·
              {{ store.currentActor?.store }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header
        class="h-16 shrink-0 border-b border-white/10 bg-ink-900/50 backdrop-blur px-6 flex items-center justify-between"
      >
        <div>
          <div class="mono">OPTIC · CHAIN · CONSOLE</div>
          <div class="font-display text-xl tracking-wide text-paper">
            {{ headline }}
          </div>
        </div>
        <RoleSwitcher />
      </header>
      <main class="flex-1 min-h-0 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
