<template>
  <div class="flex h-screen">
    <aside class="w-64 bg-gray-900 text-white flex flex-col">
      <div class="p-4 border-b border-gray-800">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <span>📷</span>
          胶片冲扫管理
        </h1>
      </div>

      <nav class="flex-1 p-4 space-y-2">
        <button
          v-for="item in menuItems"
          :key="item.path"
          @click="currentView = item.path"
          :class="[
            'w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3',
            currentView === item.path
              ? 'bg-amber-500 text-white'
              : 'text-gray-300 hover:bg-gray-800',
          ]"
        >
          <span>{{ item.icon }}</span>
          {{ item.name }}
          <span
            v-if="item.badge"
            class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
          >
            {{ item.badge }}
          </span>
        </button>
      </nav>

      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center"
          >
            {{ user?.full_name?.charAt(0) || "U" }}
          </div>
          <div class="flex-1">
            <p class="font-medium text-sm">{{ user?.full_name }}</p>
            <p class="text-xs text-gray-400">{{ getRoleName(user?.role) }}</p>
          </div>
          <button
            @click="logout"
            class="text-gray-400 hover:text-white"
            title="退出登录"
          >
            <span>↩</span>
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <Dashboard v-if="currentView === 'dashboard'" />
      <FilmList
        v-else-if="currentView === 'list'"
        @select-roll="handleSelectRoll"
      />
      <ContinuousReview
        v-else-if="currentView === 'review'"
        :initial-roll-id="selectedRollId"
        @roll-selected="selectedRollId = $event"
      />
      <RegisterFilm v-else-if="currentView === 'register'" />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth();

const currentView = ref("dashboard");
const stats = ref<any>(null);
const selectedRollId = ref<string | null>(null);

const menuItems = computed(() => [
  { name: "仪表总览", path: "dashboard", icon: "📊" },
  { name: "胶卷队列", path: "list", icon: "📋" },
  {
    name: "连续回查",
    path: "review",
    icon: "🔍",
    badge: stats.value?.pending_exceptions || 0,
  },
  { name: "胶卷登记", path: "register", icon: "➕" },
]);

const getRoleName = (role: string) => {
  const roles: Record<string, string> = {
    admin: "管理员",
    owner: "店主",
    technician: "冲印师",
    service: "客服",
  };
  return roles[role] || role;
};

const handleSelectRoll = (roll: any) => {
  selectedRollId.value = roll.id;
  currentView.value = "review";
};
</script>
