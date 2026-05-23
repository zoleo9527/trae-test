export enum UserRole {
  STATION_MASTER = 'station_master',
  INSPECTION_ENGINEER = 'inspection_engineer',
  OPERATION_STAFF = 'operation_staff',
  ADMIN = 'admin',
}

export const RoleLabels: Record<UserRole, string> = {
  [UserRole.STATION_MASTER]: '站长',
  [UserRole.INSPECTION_ENGINEER]: '巡检工程师',
  [UserRole.OPERATION_STAFF]: '运维内勤',
  [UserRole.ADMIN]: '管理员',
};
