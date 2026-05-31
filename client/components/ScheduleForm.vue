<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ isEdit ? '编辑排班' : '创建排班' }}
        </h3>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">员工</label>
            <select
              v-model="form.staffId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">请选择员工</option>
              <option v-for="staff in availableStaff" :key="staff.id" :value="staff.id">
                {{ staff.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
            <select
              v-model="form.projectId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">请选择项目</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input
            v-model="form.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
            <input
              v-model="form.startTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
            <input
              v-model="form.endTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">任务类型</label>
          <div class="flex gap-3">
            <label
              v-for="type in taskTypes"
              :key="type.value"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                v-model="form.taskType"
                :value="type.value"
                class="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm text-gray-700">{{ type.label }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            v-model="form.note"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="可选，填写排班备注..."
          ></textarea>
        </div>

        <div v-if="conflictError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ conflictError }}</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? '保存中...' : (isEdit ? '保存修改' : '创建排班') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Schedule } from '~/types'

interface Props {
  visible: boolean
  schedule?: Schedule | null
  initialDate?: string
  initialStaffId?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  schedule: null,
  initialDate: '',
  initialStaffId: ''
})

const emit = defineEmits<{
  close: []
  submit: [schedule: Omit<Schedule, 'id' | 'status'>]
  update: [scheduleId: string, updates: Partial<Schedule>]
}>()

const dataStore = useDataStore()

const isEdit = computed(() => !!props.schedule)
const submitting = ref(false)
const conflictError = ref('')

const taskTypes = [
  { value: 'daily', label: '日常清洁' },
  { value: 'deep', label: '深度清洁' },
  { value: 'special', label: '专项清洁' }
]

const projects = computed(() => dataStore.projects.filter(p => p.status === 'active'))
const availableStaff = computed(() => dataStore.staff.filter(s => s.status === 'active'))

const form = ref({
  staffId: '',
  projectId: '',
  date: '',
  startTime: '08:00',
  endTime: '16:00',
  taskType: 'daily' as Schedule['taskType'],
  note: ''
})

watch(() => props.visible, (visible) => {
  if (visible) {
    if (props.schedule) {
      form.value = {
        staffId: props.schedule.staffId,
        projectId: props.schedule.projectId,
        date: props.schedule.date,
        startTime: props.schedule.startTime,
        endTime: props.schedule.endTime,
        taskType: props.schedule.taskType,
        note: props.schedule.note
      }
    } else {
      form.value = {
        staffId: props.initialStaffId || '',
        projectId: '',
        date: props.initialDate || formatDate(new Date()),
        startTime: '08:00',
        endTime: '16:00',
        taskType: 'daily',
        note: ''
      }
    }
    conflictError.value = ''
  }
})

const handleSubmit = async () => {
  submitting.value = true
  conflictError.value = ''

  try {
    if (form.value.startTime >= form.value.endTime) {
      conflictError.value = '结束时间必须晚于开始时间'
      submitting.value = false
      return
    }

    if (isEdit.value && props.schedule) {
      await dataStore.updateSchedule(props.schedule.id, form.value)
      emit('update', props.schedule.id, form.value)
    } else {
      const newSchedule = await dataStore.createSchedule(form.value)
      emit('submit', newSchedule)
    }
    emit('close')
  } catch (error: any) {
    conflictError.value = error.message || '保存失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>
