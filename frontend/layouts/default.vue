<template>
  <div v-if="!auth.isLoggedIn" class="h-full">
    <NuxtPage />
  </div>
  <div v-else class="h-full flex">
    <aside class="w-56 bg-slate-900 text-slate-100 flex flex-col">
      <div class="px-5 py-4 border-b border-slate-700">
        <div class="text-base font-bold text-brand-500">水果档口</div>
        <div class="text-xs text-slate-400 mt-1">进货分级 · 档口配货</div>
      </div>
      <nav class="flex-1 px-2 py-3 space-y-1 text-sm">
        <NuxtLink
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800"
          :class="isActive(item.path) ? 'bg-slate-800' : ''"
        >
          <span>{{ item.icon }} {{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="px-4 py-3 border-t border-slate-700 text-xs">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-brand-500 font-medium">{{ auth.user?.name }}</div>
            <div class="text-slate-400">{{ auth.roleName }}</div>
          </div>
          <button
            class="btn-ghost text-slate-300 hover:text-white"
            @click="logout"
          >
            退出
          </button>
        </div>
        <div class="mt-2 flex gap-1">
          <button
            v-for="r in roleList"
            :key="r.role"
            class="flex-1 text-[11px] rounded px-2 py-1 border border-slate-700 hover:bg-slate-800"
            :class="auth.role === r.role ? 'bg-brand-600 border-brand-600' : ''"
            @click="switchRole(r)"
          >
            {{ r.short }}
          </button>
        </div>
      </div>
    </aside>
    <main class="flex-1 overflow-auto">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();
const route = useRoute();

const menu = [
  { path: "/", label: "概览", icon: "📊" },
  { path: "/purchases", label: "进货单", icon: "📥" },
  { path: "/gradings", label: "分级", icon: "🍎" },
  { path: "/allocations", label: "档口配货", icon: "🚚" },
  { path: "/sales", label: "赊销结算", icon: "💰" },
  { path: "/exceptions", label: "异常回查", icon: "⚠️" },
];

const roleList = [
  { role: "stall_manager", short: "档口", user: "admin", pass: "admin123" },
  { role: "picker", short: "配货", user: "picker", pass: "picker123" },
  { role: "finance", short: "财务", user: "finance", pass: "finance123" },
];

function isActive(p: string) {
  if (p === "/") return route.path === "/";
  return route.path.startsWith(p);
}

async function switchRole(r: { user: string; pass: string }) {
  try {
    await auth.login(r.user, r.pass);
    await navigateTo("/");
  } catch (e: any) {
    alert("切换失败：" + (e?.data?.detail || e?.message || e));
  }
}

function logout() {
  auth.logout();
  navigateTo("/login");
}
</script>
