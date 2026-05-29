<script setup lang="ts">
import { useAppStore, roles, type Role } from '@/stores/app'
import { UserCircle } from 'lucide-vue-next'

const appStore = useAppStore()

function selectRole(role: Role) {
  appStore.setRole(role)
}
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-2">
    <UserCircle class="w-4 h-4 text-forest-300 shrink-0" />
    <select
      :value="appStore.currentRole"
      class="flex-1 bg-forest-800 text-forest-200 text-xs rounded px-2 py-1 border border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-400"
      @change="selectRole(($event.target as HTMLSelectElement).value as Role)"
    >
      <option v-for="role in roles" :key="role.key" :value="role.key">
        {{ role.label }}
      </option>
    </select>
  </div>
</template>
