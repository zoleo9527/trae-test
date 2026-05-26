<script setup lang="ts">
import AppShell from '@/components/AppShell.vue';
import IncidentDrawer from '@/components/IncidentDrawer.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <AppShell v-if="auth.currentUser">
    <IncidentDrawer />
  </AppShell>
  <router-view v-else />
</template>
