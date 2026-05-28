<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-gray-600">
          拖拽营员卡片到房间床位进行分配，支持跨房间调整
        </p>
      </div>
      <div class="flex items-center gap-4">
        <el-tag type="success">
          入住率: {{ occupancyRate }}%
        </el-tag>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-6">
      <el-card shadow="hover" class="unassigned-panel">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-semibold">待分配营员</span>
            <el-tag type="info" size="small">{{ unassignedCampers.length }}</el-tag>
          </div>
        </template>
        <draggable
          v-model="unassignedCampers"
          group="campers"
          item-key="id"
          class="drag-list"
          ghost-class="ghost"
          @change="handleUnassignedChange"
        >
          <template #item="{ element }">
            <div class="camper-card drag-handle">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                :class="element.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
              >
                {{ element.name.charAt(0) }}
              </div>
              <div class="flex-1 ml-2">
                <div class="font-medium text-sm">{{ element.name }}</div>
                <div class="text-xs text-gray-500">{{ element.age }}岁</div>
              </div>
            </div>
          </template>
        </draggable>
      </el-card>

      <div class="col-span-4">
        <div class="grid grid-cols-3 gap-4">
          <el-card
            v-for="room in roomAssignments"
            :key="room.id"
            shadow="hover"
            class="room-card"
            :class="{
              'room-male': room.genderType === 'male',
              'room-female': room.genderType === 'female',
            }"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <component :is="icons.BedDouble" class="w-5 h-5" />
                  <span class="font-semibold">{{ room.building }} {{ room.name }}</span>
                </div>
                <el-tag :type="room.genderType === 'male' ? 'primary' : 'danger'" size="small">
                  {{ room.genderType === 'male' ? '男寝' : '女寝' }}
                </el-tag>
              </div>
            </template>

            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="bedNum in room.bedCount"
                :key="bedNum"
                class="bed-slot"
                :class="{ 'bed-occupied': room.assignments?.[bedNum] }"
              >
                <div v-if="room.assignments?.[bedNum]" class="bed-occupied-content">
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    :class="room.assignments[bedNum].gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
                  >
                    {{ room.assignments[bedNum].name.charAt(0) }}
                  </div>
                  <span class="text-xs ml-1 truncate">{{ room.assignments[bedNum].name }}</span>
                  <el-button
                    link
                    type="danger"
                    class="ml-auto remove-btn"
                    @click="removeFromRoom(room.assignments[bedNum].id)"
                  >
                    <component :is="icons.X" class="w-4 h-4" />
                  </el-button>
                </div>
                <div v-else class="bed-empty">
                  <span class="text-gray-400 text-xs">{{ bedNum }}号床</span>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t text-center text-sm text-gray-500">
              {{ room.occupied || 0 }} / {{ room.bedCount }} 床位
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { camperApi, roomApi } from '@/api'
import { Refresh } from '@element-plus/icons-vue'
import * as icons from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const campers = ref<any[]>([])
const roomAssignments = ref<any[]>([])

const unassignedCampers = computed(() => {
  return campers.value.filter((c) => !c.roomId)
})

const occupancyRate = computed(() => {
  const total = roomAssignments.value.reduce((sum, r) => sum + r.bedCount, 0)
  const occupied = roomAssignments.value.reduce((sum, r) => sum + (r.occupied || 0), 0)
  return total > 0 ? Math.round((occupied / total) * 100) : 0
})

const loadData = async () => {
  try {
    campers.value = await camperApi.getList()
    roomAssignments.value = await roomApi.getAssignments()
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const handleUnassignedChange = async (evt: any) => {
  if (evt.added) {
    const camper = evt.added.element
    await camperApi.unassignRoom(camper.id)
    ElMessage.success(`${camper.name} 已移出房间`)
    loadData()
  }
}

const removeFromRoom = async (camperId: string) => {
  const camper = campers.value.find((c) => c.id === camperId)
  await camperApi.unassignRoom(camperId)
  ElMessage.success(`${camper?.name} 已移出房间`)
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.unassigned-panel {
  min-height: 500px;
}

.drag-list {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.camper-card {
  display: flex;
  align-items: center;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.camper-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.room-card {
  transition: all 0.2s;
}

.room-card:hover {
  transform: translateY(-2px);
}

.room-male :deep(.el-card__header) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.room-female :deep(.el-card__header) {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
}

.bed-slot {
  min-height: 48px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  transition: all 0.2s;
}

.bed-slot:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.bed-occupied {
  border-style: solid;
  border-color: #10b981;
  background: #ecfdf5;
}

.bed-occupied-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.bed-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.bed-occupied:hover .remove-btn {
  opacity: 1;
}
</style>
