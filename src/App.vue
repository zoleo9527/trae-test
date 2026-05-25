<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="app-logo">
        <el-icon><Reading /></el-icon>
        <span>图书发行控制台</span>
      </div>
      <nav class="app-nav">
        <el-menu
          :default-active="route.path"
          :router="true"
          background-color="transparent"
          text-color="var(--app-sidebar-color)"
          active-text-color="#fff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="/returns">
            <el-icon><RefreshRight /></el-icon>
            <span>退货申请</span>
          </el-menu-item>
          <el-menu-item index="/transfers">
            <el-icon><Van /></el-icon>
            <span>库存调拨</span>
          </el-menu-item>
          <el-menu-item index="/finance">
            <el-icon><Money /></el-icon>
            <span>对账留痕</span>
          </el-menu-item>
        </el-menu>
      </nav>
      <div
        class="app-logo"
        style="
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: none;
          padding-top: 16px;
          font-size: 12px;
          color: #91a0c6;
        "
      >
        <span>v0.1 · 内部协作演示</span>
      </div>
    </aside>

    <section class="app-main">
      <header class="app-header">
        <div>
          <div class="title">{{ route.meta?.title || "图书发行控制台" }}</div>
          <div style="color: var(--app-sub-text); font-size: 12px">
            退货申请 · 库存调拨 · 对账留痕，一站式留痕
          </div>
        </div>
        <div class="role-switch">
          <span style="color: var(--app-sub-text); font-size: 13px"
            >当前角色</span
          >
          <el-radio-group
            :model-value="store.role"
            @change="onRoleChange"
            size="small"
          >
            <el-radio-button value="channel">渠道经理</el-radio-button>
            <el-radio-button value="issuer">发行专员</el-radio-button>
            <el-radio-button value="finance">财务对接</el-radio-button>
          </el-radio-group>
        </div>
      </header>
      <main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </section>

    <ExceptionDrawer />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { useConsoleStore } from "@/stores/console";
import ExceptionDrawer from "@/components/common/ExceptionDrawer.vue";

const route = useRoute();
const store = useConsoleStore();

function onRoleChange(value: string) {
  store.setRole(value as "channel" | "issuer" | "finance");
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
