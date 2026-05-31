<template>
  <div class="relative">
    <button
      @click="showMenu = !showMenu"
      class="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span class="text-gray-700 font-medium">切换角色</span>
      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="showMenu"
      class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      <div class="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">选择角色</p>
      </div>
      <div class="p-2">
        <button
          v-for="user in userStore.users"
          :key="user.id"
          @click="handleSwitchRole(user.role)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
          :class="{
            'bg-primary-50 text-primary-700': userStore.currentRole === user.role,
            'hover:bg-gray-50 text-gray-700': userStore.currentRole !== user.role
          }"
        >
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            :class="userStore.currentRole === user.role ? 'bg-primary-100' : 'bg-gray-100'"
          >
            <span class="font-semibold">{{ user.name.charAt(0) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ user.name }}</p>
            <p class="text-xs text-gray-500">{{ userStore.getRoleLabel(user.role) }}</p>
          </div>
          <svg
            v-if="userStore.currentRole === user.role"
            class="w-5 h-5 text-primary-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
      <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <p class="text-xs text-gray-400">
          提示：不同角色拥有不同的操作权限
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import type { UserRole } from '~/types'

const userStore = useUserStore()
const route = useRoute()

const showMenu = ref(false)

function handleSwitchRole(role: UserRole) {
  userStore.switchRole(role)
  showMenu.value = false
}

watch(() => route.path, () => {
  showMenu.value = false
})
</script>
