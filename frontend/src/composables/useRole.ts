import { ref, computed } from 'vue'
import type { RoleType } from '@/types'

export function useRole() {
  const currentRole = ref<RoleType>('manager')

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
