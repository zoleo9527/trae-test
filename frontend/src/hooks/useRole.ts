import { useApp } from '@/store/AppContext';
import { getPermissions } from '@/utils/permission';
import { mockUsers } from '@/data/mock';
import { setCurrentUser } from '@/store/actions';
import type { Role } from '@/types';

export function useRole() {
  const { state, dispatch } = useApp();
  const currentUser = state.currentUser;
  const currentRole = currentUser?.role || 'quality_engineer';
  const permissions = getPermissions(currentRole);

  const switchRole = (role: Role) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      dispatch(setCurrentUser(user));
    }
  };

  return {
    currentUser,
    currentRole,
    permissions,
    switchRole,
    canCreateShipping: permissions.canCreateShipping,
    canApproveShipping: permissions.canApproveShipping,
    canShip: permissions.canShip,
    canSignReceipt: permissions.canSignReceipt,
    canVerifyReceipt: permissions.canVerifyReceipt,
    canRecordDifference: permissions.canRecordDifference,
    canJudgeResponsibility: permissions.canJudgeResponsibility,
    canCreateRework: permissions.canCreateRework,
    canExecuteRework: permissions.canExecuteRework,
    canReviewRework: permissions.canReviewRework,
    canRuleDispute: permissions.canRuleDispute,
    canViewAllData: permissions.canViewAllData,
  };
}
