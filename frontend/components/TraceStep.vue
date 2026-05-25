<template>
  <div class="flex items-start gap-2">
    <div class="flex flex-col items-center">
      <div
        class="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
        :class="
          done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : active
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'bg-slate-200 border-slate-300 text-slate-400'
        "
      >
        {{ done ? "✓" : active ? "•" : "" }}
      </div>
      <div class="w-px flex-1 bg-slate-200 my-1"></div>
    </div>
    <div class="flex-1 pb-2">
      <div
        class="text-sm font-medium"
        :class="
          done
            ? 'text-emerald-700'
            : active
              ? 'text-slate-800'
              : 'text-slate-400'
        "
      >
        {{ label }}
      </div>
      <div v-if="active || done" class="mt-1">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; active?: boolean; done?: boolean }>();
</script>
