import { AuditService } from './audit.service';
import { AuditAction, AuditEntityType } from '../common/enums/audit.enum';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(page?: number, limit?: number, entityType?: AuditEntityType, action?: AuditAction): Promise<{
        data: import("./entities/audit-log.entity").AuditLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByEntity(entityType: AuditEntityType, entityId: string): Promise<import("./entities/audit-log.entity").AuditLog[]>;
    getEntityHistory(entityType: AuditEntityType, entityId: string): Promise<import("./entities/audit-log.entity").AuditLog[]>;
    findByUser(userId: string): Promise<import("./entities/audit-log.entity").AuditLog[]>;
}
