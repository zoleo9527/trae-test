import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, RoleLabels, WorkOrderStatus } from '../types/index';

export const RoleTodoStatuses: Record<UserRole, WorkOrderStatus[]> = {
  [UserRole.STATION_MASTER]: [
    WorkOrderStatus.ABNORMAL_REPORTED,
    WorkOrderStatus.REVIEW_SUBMITTED,
  ],
  [UserRole.INSPECTION_ENGINEER]: [
    WorkOrderStatus.DOWNTIME_CONFIRMED,
    WorkOrderStatus.PART_APPROVED,
    WorkOrderStatus.PART_RECEIVED,
    WorkOrderStatus.REPAIR_COMPLETED,
  ],
  [UserRole.OPERATION_STAFF]: [
    WorkOrderStatus.PART_REQUESTED,
  ],
  [UserRole.ADMIN]: Object.values(WorkOrderStatus).filter(s => s !== WorkOrderStatus.CLOSED),
};

export const RoleTodoActions: Record<UserRole, Record<WorkOrderStatus, string>> = {
  [UserRole.STATION_MASTER]: {
    [WorkOrderStatus.ABNORMAL_REPORTED]: '确认停机',
    [WorkOrderStatus.REVIEW_SUBMITTED]: '验证复盘',
  } as Record<WorkOrderStatus, string>,
  [UserRole.INSPECTION_ENGINEER]: {
    [WorkOrderStatus.DOWNTIME_CONFIRMED]: '申请备件',
    [WorkOrderStatus.PART_APPROVED]: '签收备件',
    [WorkOrderStatus.PART_RECEIVED]: '完成维修',
    [WorkOrderStatus.REPAIR_COMPLETED]: '提交复盘',
  } as Record<WorkOrderStatus, string>,
  [UserRole.OPERATION_STAFF]: {
    [WorkOrderStatus.PART_REQUESTED]: '审批备件',
  } as Record<WorkOrderStatus, string>,
  [UserRole.ADMIN]: {
    [WorkOrderStatus.ABNORMAL_REPORTED]: '确认停机',
    [WorkOrderStatus.DOWNTIME_CONFIRMED]: '申请备件',
    [WorkOrderStatus.PART_REQUESTED]: '审批备件',
    [WorkOrderStatus.PART_APPROVED]: '签收备件',
    [WorkOrderStatus.PART_RECEIVED]: '完成维修',
    [WorkOrderStatus.REPAIR_COMPLETED]: '提交复盘',
    [WorkOrderStatus.REVIEW_SUBMITTED]: '验证复盘',
  } as Record<WorkOrderStatus, string>,
};

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  roleTodoStatuses: WorkOrderStatus[];
  getActionLabel: (status: WorkOrderStatus) => string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.INSPECTION_ENGINEER);

  const roleTodoStatuses = RoleTodoStatuses[currentRole] || [];

  const getActionLabel = (status: WorkOrderStatus): string => {
    return RoleTodoActions[currentRole]?.[status] || '处理';
  };

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, roleTodoStatuses, getActionLabel }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
