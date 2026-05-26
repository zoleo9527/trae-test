import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export function useMenuEvents() {
  const router = useRouter()

  function handleNewAppeal() {
    router.push('/appeals/new')
  }

  function handleAssignLocker() {
    router.push('/lockers')
  }

  function handleSwitchRole() {
    router.push('/login')
  }

  onMounted(() => {
    window.app.onMenuNewAppeal?.(handleNewAppeal)
    window.app.onMenuAssignLocker?.(handleAssignLocker)
    window.app.onMenuSwitchRole?.(handleSwitchRole)
  })

  onUnmounted(() => {
    window.app.removeMenuNewAppeal?.(handleNewAppeal)
    window.app.removeMenuAssignLocker?.(handleAssignLocker)
    window.app.removeMenuSwitchRole?.(handleSwitchRole)
  })

  return {}
}
