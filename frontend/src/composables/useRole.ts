import { ref, computed } from 'vue'
import type { RoleType } from '@/types'

const sharedRole = ref<RoleType>('manager')

export function useRole() {
  const currentRole = sharedRole

  const roleName = computed(() => {
    const map: Record<RoleType, string> = {
      manager: '门店主理人',
      kitchen: '后厨负责人',
      service: '客服',
    }
    return map[currentRole.value]
  })

  function setRole(role: RoleType) {
    currentRole.value = role
  }

  return { currentRole, roleName, setRole }
}
