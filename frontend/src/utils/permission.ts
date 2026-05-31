import type { Role } from '@/types';
import type { PermissionConfig } from '@/types/state';

export function getPermissions(role: Role): PermissionConfig {
  switch (role) {
    case 'project_manager':
      return {
        canCreateShipping: false,
        canApproveShipping: true,
        canShip: false,
        canSignReceipt: false,
        canVerifyReceipt: false,
        canRecordDifference: true,
        canJudgeResponsibility: true,
        canCreateRework: false,
        canExecuteRework: false,
        canReviewRework: false,
        canRuleDispute: true,
        canViewAllData: true,
      };
    case 'quality_engineer':
      return {
        canCreateShipping: true,
        canApproveShipping: false,
        canShip: true,
        canSignReceipt: false,
        canVerifyReceipt: true,
        canRecordDifference: true,
        canJudgeResponsibility: true,
        canCreateRework: true,
        canExecuteRework: false,
        canReviewRework: true,
        canRuleDispute: false,
        canViewAllData: true,
      };
    case 'team_leader':
      return {
        canCreateShipping: false,
        canApproveShipping: false,
        canShip: false,
        canSignReceipt: true,
        canVerifyReceipt: false,
        canRecordDifference: true,
        canJudgeResponsibility: false,
        canCreateRework: false,
        canExecuteRework: true,
        canReviewRework: false,
        canRuleDispute: false,
        canViewAllData: false,
      };
    default:
      return {
        canCreateShipping: false,
        canApproveShipping: false,
        canShip: false,
        canSignReceipt: false,
        canVerifyReceipt: false,
        canRecordDifference: false,
        canJudgeResponsibility: false,
        canCreateRework: false,
        canExecuteRework: false,
        canReviewRework: false,
        canRuleDispute: false,
        canViewAllData: false,
      };
  }
}

export function hasPermission(
  role: Role,
  permission: keyof PermissionConfig
): boolean {
  const permissions = getPermissions(role);
  return permissions[permission];
}
