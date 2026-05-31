<template>
  <div
    class="p-4 rounded-xl border transition-all duration-200"
    :class="[
      item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'
    ]"
  >
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0 mt-0.5">
        <button
          v-if="canEdit"
          @click="handleToggle"
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-primary-500'"
        >
          <svg v-if="item.completed" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <div
          v-else
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
          :class="item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'"
        >
          <svg v-if="item.completed" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <p
          class="font-medium text-gray-900"
          :class="{ 'line-through text-gray-400': item.completed }"
        >
          {{ item.description }}
        </p>

        <div class="flex flex-wrap items-center gap-4 mt-2">
          <span v-if="item.completedDate" class="text-sm text-gray-500 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ item.completedDate }}
          </span>
          <span
            v-if="item.completed"
            class="text-sm text-green-600 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            已完成
          </span>
        </div>

        <div v-if="canEdit && !item.completed" class="mt-3">
          <input
            v-model="localNote"
            type="text"
            placeholder="添加备注..."
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            @blur="handleNoteUpdate"
            @keyup.enter="handleNoteUpdate"
          />
        </div>
        <p v-else-if="item.note" class="text-sm text-gray-500 mt-2">
          💬 {{ item.note }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type { RectificationItem } from '~/types'

interface Props {
  item: RectificationItem
  itemIndex: number
  rectId: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<{
  update: [itemIndex: number, completed: boolean, note: string]
}>()

const authStore = useAuthStore()

const localNote = ref(props.item.note)

watch(() => props.item.note, (newNote) => {
  localNote.value = newNote
})

const canEdit = ref(!props.readonly && authStore.currentRole !== 'quality_inspector')

function handleToggle() {
  const newCompleted = !props.item.completed
  emit('update', props.itemIndex, newCompleted, localNote.value)
}

function handleNoteUpdate() {
  if (localNote.value !== props.item.note) {
    emit('update', props.itemIndex, props.item.completed, localNote.value)
  }
}
</script>
