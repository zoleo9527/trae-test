<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <span class="w-2 h-2 rounded-full" :class="roleColor"></span>
      <span class="hidden sm:inline">{{ store.currentRoleName }}</span>
      <Icon name="lucide:chevron-down" class="w-4 h-4 text-gray-500" />
    </button>
    
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
      >
        <div class="px-3 py-2 border-b border-gray-100">
          <p class="text-xs font-medium text-gray-500">切换角色演示</p>
        </div>
        <div class="py-1">
          <button
            v-for="user in users"
            :key="user.id"
            @click="switchRole(user.id)"
            class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
            :class="{ 'bg-museum-50': user.id === store.currentUser.id }"
          >
            <img :src="user.avatar" :alt="user.name" class="w-8 h-8 rounded-full" />
            <div class="text-left flex-1">
              <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
              <p class="text-xs text-gray-500">{{ roleNames[user.role] }}</p>
            </div>
            <span v-if="user.id === store.currentUser.id" class="text-museum-600">
              <Icon name="lucide:check" class="w-4 h-4" />
            </span>
          </button>
        </div>
        <div class="px-3 py-2 border-t border-gray-100">
          <p class="text-xs text-gray-400">不同角色看到的信息和权限不同</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMuseumStore } from '~/stores/museum'
import { users, roleNames } from '~/data/users'

const store = useMuseumStore()
const isOpen = ref(false)

const roleColor = computed(() => {
  const colors: Record<string, string> = {
    manager: 'bg-status-approved',
    ticketing: 'bg-status-processing',
    event: 'bg-status-pending'
  }
  return colors[store.currentRole]
})

const switchRole = (userId: string) => {
  store.switchUser(userId)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
