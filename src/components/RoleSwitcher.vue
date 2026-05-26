<script setup lang="ts">
import { useAppStore } from '../stores'
import { roles } from '../data/mock'

const store = useAppStore()
</script>

<template>
  <div class="role-switcher">
    <div class="role-label">当前角色</div>
    <div class="role-tabs">
      <button
        v-for="role in roles"
        :key="role.id"
        class="role-tab"
        :class="{ active: store.currentRole === role.id }"
        :style="{ '--role-color': role.color }"
        @click="store.setRole(role.id)"
      >
        <span class="role-dot" :style="{ background: role.color }"></span>
        {{ role.name }}
      </button>
    </div>
    <div class="role-hint">
      <span class="hint-icon">ⓘ</span>
      {{ store.roleInfo.description }}
    </div>
  </div>
</template>

<style scoped>
.role-switcher {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.08);
  padding: 8px 16px;
  border-radius: 12px;
}

.role-label {
  color: #c7d2fe;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.role-tabs {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.15);
  padding: 3px;
  border-radius: 8px;
}

.role-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #c7d2fe;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.role-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.role-tab.active {
  background: var(--role-color);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.role-tab.active .role-dot {
  background: #ffffff !important;
}

.role-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #a5b4fc;
  font-size: 11px;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint-icon {
  font-size: 12px;
}
</style>