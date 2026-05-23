<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="label">
      {{ label }}
      <span v-if="required" class="text-coral-500 ml-1">*</span>
    </label>
    <div class="relative">
      <span v-if="icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <component :is="icon" class="w-5 h-5" />
      </span>
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[inputClass, icon ? 'pl-10' : '']"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-coral-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'date'
  modelValue?: string | number
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  icon?: any
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  disabled: false,
  required: false,
  customClass: '',
})

defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`)
const inputClass = computed(() => 
  `w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all duration-200 ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : ''} ${props.error ? 'border-coral-400 focus:border-coral-400 focus:ring-coral-100' : ''} ${props.customClass}`
)
</script>
