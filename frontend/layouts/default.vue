<template>
  <div class="min-h-screen flex bg-gray-50">
    <aside class="w-60 bg-white border-r border-gray-100 flex flex-col">
      <div class="px-5 py-4 border-b border-gray-100">
        <div class="text-lg font-semibold text-brand-700">泳池运营台</div>
        <div class="text-xs text-gray-500 mt-1">水质巡检 · 整改回查</div>
      </div>
      <nav class="flex-1 px-2 py-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
          active-class="bg-brand-50 text-brand-700 font-medium"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="px-3 py-3 border-t border-gray-100 text-xs text-gray-400">
        v0.1 · 本地演示
      </div>
    </aside>

    <div class="flex-1 flex flex-col">
      <header
        class="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between"
      >
        <div class="flex items-center gap-3 text-gray-600">
          <span class="text-sm">{{ pageTitle }}</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="text-gray-500">馆长 · 陈经理</span>
          <span
            class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs"
            >陈</span
          >
        </div>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>

    <ExceptionDrawer v-if="drawer.open" />
  </div>
</template>

<script setup lang="ts">
const drawer = useDrawerStore();
const route = useRoute();
const navItems = [
  { to: "/", label: "首页总览" },
  { to: "/courses", label: "课程表" },
  { to: "/members", label: "会员储值" },
  { to: "/inspections", label: "水质巡检" },
  { to: "/rectifications", label: "整改与回查" },
  { to: "/leaves", label: "请假与消课" },
  { to: "/complaints", label: "投诉回看" },
];
const pageTitle = computed(() => {
  const item = navItems.find((n) => n.to === route.path);
  return item?.label || "首页总览";
});
</script>
