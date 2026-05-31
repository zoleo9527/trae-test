import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ReviewItem } from '@/types'
import { reviewItems as mockReviews } from '@/data/mockRefunds'

export const useReviewStore = defineStore('review', () => {
  const reviewItems = ref<ReviewItem[]>([...mockReviews])

  const pendingReviews = computed(() =>
    reviewItems.value.filter(r => r.status === 'pending'),
  )

  function reviewItemsByType(type: ReviewItem['type']) {
    return reviewItems.value.filter(r => r.type === type)
  }

  function approveItem(id: string, reviewer: string) {
    const item = reviewItems.value.find(r => r.id === id)
    if (item) {
      item.status = 'approved'
      item.reviewedAt = new Date().toISOString()
      item.reviewer = reviewer
    }
  }

  function rejectItem(id: string, reviewer: string) {
    const item = reviewItems.value.find(r => r.id === id)
    if (item) {
      item.status = 'rejected'
      item.reviewedAt = new Date().toISOString()
      item.reviewer = reviewer
    }
  }

  function batchApprove(ids: string[], reviewer: string = 'manager') {
    for (const id of ids) {
      approveItem(id, reviewer)
    }
  }

  return {
    reviewItems,
    pendingReviews,
    reviewItemsByType,
    approveItem,
    rejectItem,
    batchApprove,
  }
})
