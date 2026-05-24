import { BaseEntity } from './base.entity';
import { User } from './user.entity';
export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    STATUS_CHANGE = "status_change",
    HANDOVER = "handover",
    APPROVE = "approve",
    REJECT = "reject",
    CONFIRM = "confirm",
    CANCEL = "cancel",
    LOGIN = "login",
    LOGOUT = "logout"
}
export declare enum AuditModule {
    WORK_ORDER = "work_order",
    REPAIR = "repair",
    FOLLOW_UP = "follow_up",
    MEMBER = "member",
    PRODUCT = "product",
    USER = "user",
    SYSTEM = "system"
}
export declare class AuditLog extends BaseEntity {
    module: AuditModule;
    recordId: string;
    action: AuditAction;
    operatorId: string;
    operator: User;
    operatorName: string;
    actionDescription: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    ipAddress: string;
    userAgent: string;
}
