<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores'
import OrderListPanel from './OrderListPanel.vue'
import OverviewDashboard from './OverviewDashboard.vue'
import OrderDetailPanel from './OrderDetailPanel.vue'
import TicketDetailPanel from './TicketDetailPanel.vue'
import BatchReviewPanel from './BatchReviewPanel.vue'

const store = useAppStore()

const showDetailPanel = computed(() => store.selectedOrderId !== null || store.selectedTicketId !== null)
</script>

<template>
  <div class="workspace">
    <aside class="workspace-sidebar">
      <OrderListPanel />
    </aside>

    <section class="workspace-center">
      <template v-if="store.viewMode === 'overview'">
        <OverviewDashboard />
      </template>
      <template v-else-if="store.selectedTicketId">
        <TicketDetailPanel />
      </template>
      <template v-else-if="store.selectedOrderId">
        <OrderDetailPanel />
      </template>
    </section>

    <aside class="workspace-right">
      <BatchReviewPanel />
    </aside>
  </div>
</template>

<style scoped>
.workspace {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.workspace-sidebar {
  width: 300px;
  min-width: 300px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.workspace-center {
  flex: 1;
  overflow-y: auto;
  background: #f3f4f6;
}

.workspace-right {
  width: 380px;
  min-width: 380px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
}
</style>