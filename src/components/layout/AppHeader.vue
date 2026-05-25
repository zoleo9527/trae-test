<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useExceptionStore } from '@/stores/exception'
import type { UserRole } from '@/types'
import { Bell, User, ChevronDown } from 'lucide-vue-next'
import { ref } from 'vue'

const appStore = useAppStore()
const exceptionStore = useExceptionStore()
const route = useRoute()

const showRoleMenu = ref(false)
const showNotification = ref(false)

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'manager', label: '馆务经理', desc: '全局查看与审批' },
  { value: 'ticket', label: '票务专员', desc: '核销操作处理' },
  { value: 'executor', label: '活动执行', desc: '异常处理与回查' }
]

const switchRole = (role: UserRole) => {
  appStore.setRole(role)
  showRoleMenu.value = false
}

const pageTitle = route.meta?.title as string || '运营看板'
</script>

<template>
  <header class="bg-white border-b border-museum-gray-200 px-6 py-4 flex items-center justify-between">
    <div>
      <h1 class="font-serif text-xl font-semibold text-museum-gray-800">{{ pageTitle }}</h1>
      <p class="text-sm text-museum-gray-500">欢迎回来，{{ appStore.roleNames[appStore.currentRole] }}</p>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative">
        <button 
          @click="showNotification = !showNotification"
          class="relative p-2 rounded-lg hover:bg-museum-gray-100 transition-colors"
        >
          <Bell class="w-5 h-5 text-museum-gray-600" />
          <span 
            v-if="exceptionStore.pendingCount > 0"
            class="absolute top-1 right-1 w-2 h-2 bg-museum-coral rounded-full"
          ></span>
        </button>
        
        <div 
          v-if="showNotification"
          class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-museum-hover border border-museum-gray-200 z-50 animate-fade-in"
        >
          <div class="p-4 border-b border-museum-gray-200">
            <h3 class="font-semibold text-museum-gray-800">异常通知</h3>
          </div>
          <div class="max-h-64 overflow-auto">
            <div 
              v-for="exception in exceptionStore.sortedExceptions.slice(0, 3)"
              :key="exception.id"
              class="p-3 border-b border-museum-gray-100 hover:bg-museum-gray-50 cursor-pointer"
              @click="exceptionStore.openDrawer(exception.id); showNotification = false"
            >
              <div class="flex items-start gap-2">
                <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  :class="{
                    'bg-museum-coral animate-pulse': exception.priority === 'urgent',
                    'bg-museum-orange': exception.priority === 'high',
                    'bg-museum-gold': exception.priority === 'medium',
                    'bg-museum-gray-400': exception.priority === 'low'
                  }"
                ></span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-museum-gray-800 truncate">{{ exception.title }}</p>
                  <p class="text-xs text-museum-gray-500">{{ exception.reportTime }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <button 
          @click="showRoleMenu = !showRoleMenu"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-museum-gray-100 transition-colors"
        >
          <div class="w-8 h-8 bg-museum-gold/20 rounded-full flex items-center justify-center">
            <User class="w-4 h-4 text-museum-gold" />
          </div>
          <div class="text-left">
            <p class="text-sm font-medium text-museum-gray-800">{{ appStore.roleNames[appStore.currentRole] }}</p>
            <p class="text-xs text-museum-gray-500">点击切换角色</p>
          </div>
          <ChevronDown class="w-4 h-4 text-museum-gray-500" :class="{ 'rotate-180': showRoleMenu }" />
        </button>

        <div 
          v-if="showRoleMenu"
          class="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-museum-hover border border-museum-gray-200 z-50 animate-fade-in"
        >
          <div class="p-2">
            <button
              v-for="role in roles"
              :key="role.value"
              @click="switchRole(role.value)"
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="appStore.currentRole === role.value 
                ? 'bg-museum-gold/10 text-museum-dark' 
                : 'hover:bg-museum-gray-50'"
            >
              <p class="text-sm font-medium">{{ role.label }}</p>
              <p class="text-xs text-museum-gray-500">{{ role.desc }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
