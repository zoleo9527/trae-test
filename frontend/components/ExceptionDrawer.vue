<template>
  <div
    class="fixed inset-0 z-50 flex justify-end bg-black/20"
    @click.self="drawer.closeDrawer()"
  >
    <div
      class="w-[480px] h-full bg-white shadow-xl flex flex-col animate-slide-in"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-gray-100"
      >
        <div class="text-base font-semibold text-gray-800">
          {{ drawer.title }}
        </div>
        <button
          class="text-gray-400 hover:text-gray-700 text-lg"
          @click="drawer.closeDrawer()"
        >
          ×
        </button>
      </div>
      <div class="flex-1 overflow-auto px-5 py-4">
        <LeaveReviewDrawer v-if="drawer.kind === 'leave-review'" />
        <LeaveCreateDrawer v-else-if="drawer.kind === 'leave-create'" />
        <RectificationDrawer v-else-if="drawer.kind === 'rectification'" />
        <RecheckDrawer v-else-if="drawer.kind === 'recheck'" />
        <InspectionDrawer v-else-if="drawer.kind === 'inspection'" />
        <div v-else class="text-sm text-gray-500">选择左侧菜单开始操作。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const drawer = useDrawerStore();
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.18s ease-out;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
