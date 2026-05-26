<script setup lang="ts">
import { computed } from 'vue'
import type { StatusHistory, TicketHistory } from '../types'

interface TimelineEntry {
  action: string
  at: string
  detail: string
  by: string
}

const props = defineProps<{
  history: (StatusHistory | TicketHistory)[]
}>()

const normalized = computed<TimelineEntry[]>(() =>
  props.history.map(item => {
    if ('status' in item) {
      return {
        action: item.status,
        at: item.changedAt,
        detail: item.note,
        by: item.changedBy
      }
    }
    return {
      action: item.action,
      at: item.at,
      detail: item.detail,
      by: item.by
    }
  })
)
</script>

<template>
  <div class="timeline">
    <div
      v-for="(item, idx) in normalized"
      :key="idx"
      class="timeline-item"
    >
      <div class="timeline-dot-wrapper">
        <div class="timeline-dot"></div>
        <div v-if="idx < normalized.length - 1" class="timeline-line"></div>
      </div>
      <div class="timeline-content">
        <div class="timeline-top">
          <span class="timeline-action">{{ item.action }}</span>
          <span class="timeline-time">{{ item.at }}</span>
        </div>
        <div class="timeline-note">{{ item.detail }}</div>
        <div class="timeline-by">
          <span class="by-label">操作人：</span>
          {{ item.by }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  padding: 16px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6366f1;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #6366f1;
  flex-shrink: 0;
  margin-top: 2px;
}

.timeline-line {
  flex: 1;
  width: 2px;
  background: #e5e7eb;
  margin-top: 4px;
  min-height: 24px;
}

.timeline-content {
  flex: 1;
  padding-bottom: 4px;
}

.timeline-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-action {
  font-size: 13px;
  font-weight: 600;
  color: #4f46e5;
}

.timeline-time {
  font-size: 11px;
  color: #9ca3af;
  font-family: 'SF Mono', Menlo, monospace;
}

.timeline-note {
  font-size: 12px;
  color: #374151;
  margin-bottom: 4px;
  line-height: 1.5;
}

.timeline-by {
  font-size: 11px;
  color: #9ca3af;
}

.by-label {
  color: #d1d5db;
}
</style>