<script setup lang="ts">
import { computed } from 'vue';
import { Tractor, CalendarDays, ClipboardList, LayoutDashboard, LogOut, AlertTriangle, Bell, Settings2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useIncidentStore } from '@/stores/incident';
import { roleLabel } from '@/composables/useFormat';

const auth = useAuthStore();
const incident = useIncidentStore();

const menu = computed(() => [
  { to: '/', label: '概览', icon: LayoutDashboard },
  { to: '/bookings', label: '作业预约', icon: ClipboardList },
  { to: '/schedules', label: '机手排班', icon: CalendarDays },
  { to: '/tasks', label: '我的任务', icon: Tractor, only: 'operator' as const },
]);

const activeMenu = computed(() => menu.value.filter(m => !m.only || m.only === auth.role));
</script>

<template>
  <div class="h-full flex">
    <aside class="w-60 shrink-0 border-r border-black/5 bg-white/70 backdrop-blur-sm">
      <div class="h-14 px-5 flex items-center gap-2 border-b border-black/5">
        <div class="w-8 h-8 rounded-lg bg-ink-900 text-amber-450 grid place-items-center">
          <Tractor :size="18" />
        </div>
        <div class="leading-tight">
          <div class="text-sm font-semibold text-ink-950">农机合作社</div>
          <div class="text-[11px] text-ink-900/60">作业预约 · 排班协作</div>
        </div>
      </div>

      <nav class="p-3 space-y-1">
        <router-link
          v-for="item in activeMenu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm text-ink-900 hover:bg-black/5 transition-colors"
          active-class="!bg-ink-900 !text-white shadow-card"
        >
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="px-3 mt-2">
        <div class="surface p-3">
          <div class="flex items-center gap-2 text-xs text-ink-900/70">
            <AlertTriangle :size="14" class="text-amber-450" />
            异常提醒
          </div>
          <div class="mt-2 text-2xl font-semibold text-ink-950">
            {{ incident.counts.unresolved }}
            <span class="text-xs text-ink-900/50 font-normal ml-1">未处理</span>
          </div>
          <div class="text-[11px] text-ink-900/60 mt-1">高 {{ incident.counts.high }} · 中 {{ incident.counts.medium }} · 低 {{ incident.counts.low }}</div>
        </div>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col">
      <header class="h-14 border-b border-black/5 bg-white/60 backdrop-blur-sm flex items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <h1 class="text-sm font-semibold text-ink-950">
            {{ auth.currentUser?.name }}
            <span class="ml-2 chip border-ink-900/10 bg-ink-900/5 text-ink-900">
              {{ auth.currentUser ? roleLabel[auth.currentUser.role] : '' }}
            </span>
          </h1>
          <span class="text-xs text-ink-900/50">当前视图仅为演示</span>
        </div>
        <div class="flex items-center gap-1">
          <button class="btn-ghost" title="切换角色" @click="auth.switchTo('director')">理事视图</button>
          <button class="btn-ghost" @click="auth.switchTo('dispatcher')">调度视图</button>
          <button class="btn-ghost" @click="auth.switchTo('operator')">机手视图</button>
          <span class="w-px h-5 bg-black/10 mx-2" />
          <button class="btn-ghost" title="通知">
            <Bell :size="16" />
          </button>
          <button class="btn-ghost" title="设置">
            <Settings2 :size="16" />
          </button>
          <button class="btn-ghost" @click="auth.logout()" title="退出登录">
            <LogOut :size="16" />
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <slot />
    </div>
  </div>
</template>
