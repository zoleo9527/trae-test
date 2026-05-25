const { Role } = require('./enums');

const Permissions = {
  SCHEDULE_VIEW: 'schedule:view',
  SCHEDULE_CREATE: 'schedule:create',
  SCHEDULE_EDIT: 'schedule:edit',
  SCHEDULE_DELETE: 'schedule:delete',
  SCHEDULE_STATUS_CHANGE: 'schedule:status:change',

  EQUIPMENT_VIEW: 'equipment:view',
  EQUIPMENT_BORROW_REQUEST: 'equipment:borrow:request',
  EQUIPMENT_BORROW_APPROVE: 'equipment:borrow:approve',
  EQUIPMENT_BORROW_RETURN: 'equipment:borrow:return',
  EQUIPMENT_MANAGE: 'equipment:manage',

  REVIEW_CREATE: 'review:create',
  REVIEW_VIEW: 'review:view',
  REVIEW_ISSUE_MANAGE: 'review:issue:manage',

  GROUP_ORDER_VIEW: 'group_order:view',
  GROUP_ORDER_CREATE: 'group_order:create',
  GROUP_ORDER_APPROVE: 'group_order:approve',
  GROUP_ORDER_REFUND: 'group_order:refund',

  REMARK_ADD: 'remark:add',
  SUPPLEMENT_ADD: 'supplement:add',

  AUDIT_LOG_VIEW: 'audit_log:view',
};

const RolePermissions = {
  [Role.THEATER_MANAGER]: [
    Permissions.SCHEDULE_VIEW,
    Permissions.SCHEDULE_CREATE,
    Permissions.SCHEDULE_EDIT,
    Permissions.SCHEDULE_DELETE,
    Permissions.SCHEDULE_STATUS_CHANGE,
    Permissions.EQUIPMENT_VIEW,
    Permissions.EQUIPMENT_BORROW_APPROVE,
    Permissions.EQUIPMENT_MANAGE,
    Permissions.REVIEW_VIEW,
    Permissions.REVIEW_CREATE,
    Permissions.REVIEW_ISSUE_MANAGE,
    Permissions.GROUP_ORDER_VIEW,
    Permissions.GROUP_ORDER_APPROVE,
    Permissions.GROUP_ORDER_REFUND,
    Permissions.REMARK_ADD,
    Permissions.SUPPLEMENT_ADD,
    Permissions.AUDIT_LOG_VIEW,
  ],
  [Role.TICKET_SUPERVISOR]: [
    Permissions.SCHEDULE_VIEW,
    Permissions.EQUIPMENT_VIEW,
    Permissions.REVIEW_VIEW,
    Permissions.GROUP_ORDER_VIEW,
    Permissions.GROUP_ORDER_CREATE,
    Permissions.GROUP_ORDER_APPROVE,
    Permissions.GROUP_ORDER_REFUND,
    Permissions.REMARK_ADD,
  ],
  [Role.BACKEND_COORDINATOR]: [
    Permissions.SCHEDULE_VIEW,
    Permissions.SCHEDULE_EDIT,
    Permissions.SCHEDULE_STATUS_CHANGE,
    Permissions.EQUIPMENT_VIEW,
    Permissions.EQUIPMENT_BORROW_REQUEST,
    Permissions.EQUIPMENT_BORROW_RETURN,
    Permissions.REVIEW_CREATE,
    Permissions.REVIEW_VIEW,
    Permissions.REVIEW_ISSUE_MANAGE,
    Permissions.GROUP_ORDER_VIEW,
    Permissions.REMARK_ADD,
    Permissions.SUPPLEMENT_ADD,
  ],
};

const hasPermission = (role, permission) => {
  return RolePermissions[role]?.includes(permission) || false;
};

module.exports = {
  Role,
  Permissions,
  RolePermissions,
  hasPermission,
};
