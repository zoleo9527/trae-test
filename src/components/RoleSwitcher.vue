<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div class="role-switcher">
    <el-dropdown trigger="click">
      <div class="current-user">
        <span class="avatar">{{ userStore.currentUser.avatar }}</span>
        <div class="user-info">
          <div class="user-name">{{ userStore.currentUser.name }}</div>
          <div class="user-role">{{ userStore.currentRoleLabel }}</div>
        </div>
        <el-icon class="arrow"><ArrowDown /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="user in userStore.users"
            :key="user.id"
            :disabled="user.id === userStore.currentUser.id"
            @click="userStore.switchUser(user.id)"
          >
            <span class="dropdown-avatar">{{ user.avatar }}</span>
            <span class="dropdown-name">{{ user.name }}</span>
            <el-tag size="small" type="info">{{ userStore.roleLabels[user.role] }}</el-tag>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.role-switcher {
  .current-user {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;

    &:hover {
      background: #f5f7fa;
    }

    .avatar {
      font-size: 32px;
    }

    .user-info {
      .user-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }

      .user-role {
        color: #909399;
        font-size: 12px;
      }
    }

    .arrow {
      color: #c0c4cc;
      font-size: 12px;
    }
  }

  .dropdown-avatar {
    font-size: 20px;
    margin-right: 8px;
  }

  .dropdown-name {
    margin-right: 8px;
  }
}
</style>
