<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-vue-next'

const userStore = useUserStore()
const router = useRouter()
const sidebarOpen = ref(true)
const userMenuOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const switchUser = (userId: string) => {
  userStore.switchUser(userId)
  userMenuOpen.value = false
}

const goToDashboard = () => {
  router.push('/')
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <aside 
      class="bg-primary text-white transition-all duration-300 flex flex-col"
      :class="sidebarOpen ? 'w-64' : 'w-20'"
    >
      <div class="p-4 flex items-center justify-between border-b border-primary-light">
        <div class="flex items-center gap-3" v-if="sidebarOpen">
          <Package class="w-8 h-8 text-accent" />
          <span class="font-bold text-lg">礼品定制</span>
        </div>
        <Package v-else class="w-8 h-8 text-accent mx-auto" />
        <button 
          @click="toggleSidebar" 
          class="p-1 rounded hover:bg-primary-light transition-colors"
          v-if="sidebarOpen"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <button 
              @click="goToDashboard"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-light/50 text-white transition-all hover:bg-primary-light"
            >
              <LayoutDashboard class="w-5 h-5 flex-shrink-0" />
              <span v-if="sidebarOpen">工作台</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <div class="p-4 border-t border-primary-light">
        <div class="flex items-center gap-3" v-if="sidebarOpen">
          <img 
            :src="userStore.currentUser.avatar" 
            :alt="userStore.currentUser.name"
            class="w-10 h-10 rounded-full bg-gray-200"
          />
          <div class="flex-1">
            <p class="font-medium text-sm">{{ userStore.currentUser.name }}</p>
            <p class="text-xs text-gray-400">{{ userStore.roleLabel }}</p>
          </div>
        </div>
        <img 
          v-else
          :src="userStore.currentUser.avatar" 
          :alt="userStore.currentUser.name"
          class="w-10 h-10 rounded-full bg-gray-200 mx-auto"
        />
      </div>
    </aside>
    
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button 
            @click="toggleSidebar" 
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            v-if="!sidebarOpen"
          >
            <Menu class="w-5 h-5 text-gray-600" />
          </button>
          <h1 class="text-xl font-semibold text-gray-800">
            <slot name="header">工作台</slot>
          </h1>
        </div>
        
        <div class="relative">
          <button 
            @click="toggleUserMenu"
            class="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <AlertTriangle class="w-5 h-5 text-accent" />
            <span class="text-sm text-gray-600">切换角色</span>
            <ChevronDown class="w-4 h-4 text-gray-400" />
          </button>
          
          <div 
            v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
          >
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-xs text-gray-500">选择角色体验</p>
            </div>
            <div class="py-1">
              <button 
                v-for="user in userStore.allUsers" 
                :key="user.id"
                @click="switchUser(user.id)"
                class="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                :class="user.id === userStore.currentUser.id ? 'bg-primary/5' : ''"
              >
                <img 
                  :src="user.avatar" 
                  :alt="user.name"
                  class="w-8 h-8 rounded-full bg-gray-200"
                />
                <div class="text-left">
                  <p class="text-sm font-medium text-gray-800">{{ user.name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ user.role === 'business' ? '项目商务' : user.role === 'sampling' ? '打样跟单' : '仓配协调' }}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
