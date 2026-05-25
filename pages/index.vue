<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">文创补货与损耗管理</h1>
        <p class="text-sm text-gray-500 mt-1">统一管理文创商品的补货和损耗记录</p>
      </div>
      <button
        v-if="store.permissions.canCreate"
        @click="showCreateModal = true"
        class="btn btn-primary flex items-center gap-2"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        新建记录
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="待审批"
        :value="store.pendingApprovalCount"
        icon="lucide:clock"
        color="amber"
      />
      <StatCard
        title="异常记录"
        :value="store.abnormalCount"
        icon="lucide:alert-triangle"
        color="red"
      />
      <StatCard
        title="本月补货"
        :value="restockThisMonth"
        icon="lucide:package"
        color="blue"
      />
      <StatCard
        title="本月损耗"
        :value="lossThisMonth"
        icon="lucide:trash-2"
        color="orange"
      />
    </div>

    <div class="card p-4">
      <RecordFilter />
    </div>

    <div class="flex gap-6">
      <div class="flex-1 min-w-0">
        <RecordList
          :records="store.filteredRecords"
          @select="handleSelectRecord"
        />
      </div>
      
      <Transition name="slide">
        <RecordDetail
          v-if="store.selectedRecord"
          :record="store.selectedRecord"
          @close="handleCloseDetail"
        />
      </Transition>
    </div>

    <Transition name="fade">
      <CreateRecordModal
        v-if="showCreateModal"
        @close="showCreateModal = false"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMuseumStore } from '~/stores/museum'

const store = useMuseumStore()
const showCreateModal = ref(false)

const restockThisMonth = computed(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return store.records.filter(r => 
    r.type === 'restock' && 
    new Date(r.createdAt) >= monthStart
  ).length
})

const lossThisMonth = computed(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return store.records.filter(r => 
    r.type === 'loss' && 
    new Date(r.createdAt) >= monthStart
  ).length
})

const handleSelectRecord = (recordId: string) => {
  store.setSelectedRecord(recordId)
}

const handleCloseDetail = () => {
  store.setSelectedRecord(null)
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
