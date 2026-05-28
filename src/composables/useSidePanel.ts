import { ref, readonly } from 'vue'

const isOpen = ref(false)
const currentOrderId = ref<string | null>(null)

export function useSidePanel() {
  function openPanel(orderId: string) {
    currentOrderId.value = orderId
    isOpen.value = true
  }

  function closePanel() {
    isOpen.value = false
    currentOrderId.value = null
  }

  return {
    isOpen: readonly(isOpen),
    currentOrderId: readonly(currentOrderId),
    openPanel,
    closePanel,
  }
}
