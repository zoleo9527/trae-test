<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
        <Icon :icon="roleIcon" class="w-4 h-4 text-primary-700" />
      </div>
      <div class="text-left">
        <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
        <p class="text-xs text-gray-500">{{ currentRoleLabel }}</p>
      </div>
      <Icon icon="mdi:chevron-down" class="w-4 h-4 text-gray-400" />
    </button>
    
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 z-50 overflow-hidden"
      >
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">切换角色</p>
        </div>
        <div class="py-2">
          <button
            v-for="role in roles"
            :key="role.value"
            @click="selectRole(role.value)"
            :class="[
              'w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors',
              currentRole === role.value ? 'bg-primary-50' : ''
            ]"
          >
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center mr-3',
              currentRole === role.value ? 'bg-primary-100' : 'bg-gray-100'
            ]">
              <Icon :icon="role.icon" :class="[
                'w-5 h-5',
                currentRole === role.value ? 'text-primary-700' : 'text-gray-500'
              ]" />
            </div>
            <div>
              <p :class="[
                'text-sm font-medium',
                currentRole === role.value ? 'text-primary-700' : 'text-gray-900'
              ]">{{ role.label }}</p>
              <p class="text-xs text-gray-500">{{ role.desc }}</p>
            </div>
            <Icon
              v-if="currentRole === role.value"
              icon="mdi:check"
              class="w-5 h-5 text-primary-600 ml-auto"
            />
          </button>
        </div>
      </div>
    </Transition>
    
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UserRole } from '~/types/workorder';

const { currentRole, currentRoleLabel, userName, setRole } = useRole();

const isOpen = ref(false);

const roleIcon = computed(() => {
  const icons: Record<UserRole, string> = {
    manager: 'mdi:account-tie',
    consultant: 'mdi:account-headset',
    technician: 'mdi:hammer-wrench',
  };
  return icons[currentRole.value];
});

const roles = [
  { value: 'manager' as UserRole, label: '售后经理', desc: '审批报价、查看全局', icon: 'mdi:account-tie' },
  { value: 'consultant' as UserRole, label: '接件顾问', desc: '登记寄修、跟进客户', icon: 'mdi:account-headset' },
  { value: 'technician' as UserRole, label: '维修技师', desc: '检测维修、更新进度', icon: 'mdi:hammer-wrench' },
];

function selectRole(role: UserRole) {
  setRole(role);
  isOpen.value = false;
}
</script>
