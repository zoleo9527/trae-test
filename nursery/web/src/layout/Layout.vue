<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElIcon } from "element-plus";
import {
  DataAnalysis,
  Document,
  Warning,
  ChatDotRound,
  Location,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);

const menuItems = [
  { path: "/dashboard", label: "数据看板", icon: DataAnalysis },
  { path: "/inspections", label: "养护巡查", icon: Document },
  { path: "/diseases", label: "病害上报", icon: Warning },
  { path: "/negotiations", label: "补苗协商", icon: ChatDotRound },
  { path: "/plots", label: "地块管理", icon: Location },
];

const currentUser = ref({ name: "赵建国", role: "基地负责人" });

const handleMenuSelect = (path: string) => {
  router.push(path);
};
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h2>🌱 苗木基地</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#001529"
        text-color="#b8c4cf"
        active-text-color="#fff"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ route.meta.title }}</div>
        <div class="header-user">
          <el-avatar :size="32" style="background: #409eff; margin-right: 8px">
            {{ currentUser.name.charAt(0) }}
          </el-avatar>
          <span>{{ currentUser.name }}</span>
          <span class="role-tag">{{ currentUser.role }}</span>
        </div>
      </el-header>
      <el-main class="main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background: #001529;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
  font-size: 18px;
  margin: 0;
}

.menu {
  border-right: none;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e4e7ed;
  height: 60px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-user {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.role-tag {
  margin-left: 12px;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
}

.main {
  padding: 0;
  background: #f5f7fa;
  overflow-y: auto;
}
</style>
