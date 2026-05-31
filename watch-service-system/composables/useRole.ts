import type { UserRole } from '~/types/workorder';
import { ROLE_LABELS } from '~/utils/constants';

export function useRole() {
  const userStore = useUserStore();
  
  const currentRole = computed(() => userStore.currentRole);
  const userName = computed(() => userStore.userName);
  const currentRoleLabel = computed(() => ROLE_LABELS[currentRole.value]);
  
  const canApprove = computed(() => currentRole.value === 'manager');
  const canCreateQuote = computed(() => currentRole.value === 'technician');
  const canRegister = computed(() => currentRole.value === 'consultant');
  const canUpdateProgress = computed(() => currentRole.value === 'technician');
  
  function setRole(role: UserRole) {
    userStore.setRole(role);
  }
  
  function initRole() {
    userStore.initFromStorage();
  }
  
  return {
    currentRole,
    userName,
    currentRoleLabel,
    canApprove,
    canCreateQuote,
    canRegister,
    canUpdateProgress,
    setRole,
    initRole,
  };
}
