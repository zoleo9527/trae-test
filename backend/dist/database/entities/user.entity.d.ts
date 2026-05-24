import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { AuditLog } from './audit-log.entity';
export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    SALES = "sales",
    WORKSHOP = "workshop",
    CUSTOMER_SERVICE = "customer_service"
}
export declare class User extends BaseEntity {
    username: string;
    password: string;
    realName: string;
    phone: string;
    role: UserRole;
    isActive: boolean;
    handledOrders: WorkOrder[];
    auditLogs: AuditLog[];
}
