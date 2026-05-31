import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { AuditAction, AuditEntityType } from '../../common/enums/audit.enum';
export declare class AuditLog extends BaseEntity {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    entityName?: string;
    userId?: string;
    user?: User;
    userName?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changedFields?: string[];
    description?: string;
    metadata?: Record<string, any>;
}
