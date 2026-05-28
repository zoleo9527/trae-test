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
            <div class="camper-card">
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
              'room-gender-blocked': draggingCamper && draggingCamper.gender !== room.genderType,
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
              <draggable
                v-for="bedNum in room.bedCount"
                :key="bedNum"
                v-model="bedLists[`${room.id}-${bedNum}`]"
                :group="getBedGroup(room.id, bedNum)"
                item-key="id"
                class="bed-slot"
                :class="{
                  'bed-occupied': bedLists[`${room.id}-${bedNum}`]?.length,
                  'bed-blocked': isBedBlocked(room, bedNum),
                }"
                ghost-class="ghost"
                @start="onDragStart($event, room)"
                @end="onDragEnd"
                @change="(evt: any) => handleBedChange(evt, room.id, bedNum)"
              >
                <template #item="{ element }">
                  <div class="bed-occupied-content">
                    <div
                      class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      :class="element.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
                    >
                      {{ element.name.charAt(0) }}
                    </div>
                    <span class="text-xs ml-1 truncate">{{ element.name }}</span>
                    <el-button
                      link
                      type="danger"
                      class="ml-auto remove-btn"
                      @click.stop="removeFromRoom(element.id)"
                    >
                      <component :is="icons.X" class="w-4 h-4" />
                    </el-button>
                  </div>
                </template>
                <template #footer>
                  <div v-if="!bedLists[`${room.id}-${bedNum}`]?.length" class="bed-empty">
                    <span class="text-gray-400 text-xs">{{ bedNum }}号床</span>
                  </div>
                </template>
              </draggable>
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
const unassignedCampers = ref<any[]>([])
const bedLists = ref<Record<string, any[]>>({})
const draggingCamper = ref<any>(null)

const occupancyRate = computed(() => {
  const total = roomAssignments.value.reduce((sum, r) => sum + r.bedCount, 0)
  const occupied = roomAssignments.value.reduce((sum, r) => sum + (r.occupied || 0), 0)
  return total > 0 ? Math.round((occupied / total) * 100) : 0
})

const getBedGroup = (roomId: string, bedNum: number) => {
  const key = `${roomId}-${bedNum}`
  if (bedLists.value[key]?.length > 0) {
    return { name: 'campers', put: false }
  }
  return { name: 'campers', put: true }
}

const isBedBlocked = (room: any, _bedNum: number) => {
  if (!draggingCamper.value) return false
  return draggingCamper.value.gender !== room.genderType
}

const onDragStart = (evt: any, room: any) => {
  const key = `${room.id}-${evt.oldIndex + 1}`
  const list = bedLists.value[key]
  if (list?.length) {
    draggingCamper.value = list[0]
  }
}

const onDragEnd = () => {
  draggingCamper.value = null
}

const loadData = async () => {
  try {
    campers.value = await camperApi.getList()
    roomAssignments.value = await roomApi.getAssignments()

    unassignedCampers.value = campers.value.filter((c) => !c.roomId)

    const newBedLists: Record<string, any[]> = {}
    for (const room of roomAssignments.value) {
      for (let bedNum = 1; bedNum <= room.bedCount; bedNum++) {
        const key = `${room.id}-${bedNum}`
        if (room.assignments?.[bedNum]) {
          newBedLists[key] = [{ ...room.assignments[bedNum] }]
        } else {
          newBedLists[key] = []
        }
      }
    }
    bedLists.value = newBedLists
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const handleUnassignedChange = async (evt: any) => {
  if (evt.added) {
    const camper = evt.added.element
    try {
      await camperApi.unassignRoom(camper.id)
      ElMessage.success(`${camper.name} 已移出房间`)
    } catch (e) {
      ElMessage.error('移出房间失败')
    }
    loadData()
  }
}

const handleBedChange = async (evt: any, roomId: string, bedNum: number) => {
  if (evt.added) {
    const camper = evt.added.element
    const room = roomAssignments.value.find((r) => r.id === roomId)

    if (room && camper.gender !== room.genderType) {
      ElMessage.error(`${camper.name}（${camper.gender === 'male' ? '男' : '女'}）与${room.name}（${room.genderType === 'male' ? '男寝' : '女寝'}）性别不符`)
      loadData()
      return
    }

    try {
      await roomApi.assignBed(roomId, { bedNumber: bedNum, camperId: camper.id })
      ElMessage.success(`${camper.name} 已分配到 ${bedNum}号床`)
    } catch (e: any) {
      const msg = e?.response?.data?.message || '分配床位失败'
      ElMessage.error(msg)
    }
    loadData()
  }
}

const removeFromRoom = async (camperId: string) => {
  const camper = campers.value.find((c) => c.id === camperId)
  try {
    await camperApi.unassignRoom(camperId)
    ElMessage.success(`${camper?.name} 已移出房间`)
  } catch (e) {
    ElMessage.error('移出房间失败')
  }
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
  cursor: grab;
}

.camper-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.camper-card:active {
  cursor: grabbing;
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

.room-gender-blocked {
  opacity: 0.5;
  pointer-events: none;
}

.room-gender-blocked :deep(.el-card__header) {
  filter: grayscale(0.5);
}

.bed-slot {
  min-height: 48px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  transition: all 0.2s;
  min-width: 0;
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

.bed-blocked {
  border-color: #fca5a5;
  background: #fef2f2;
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
