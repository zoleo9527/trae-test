import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(page?: number, limit?: number): Promise<{
        data: import("./audit-log.entity").AuditLog[];
        total: number;
    }>;
    findByEntity(entityType: string, entityId: string): Promise<import("./audit-log.entity").AuditLog[]>;
    findByOperator(operatorId: string): Promise<import("./audit-log.entity").AuditLog[]>;
}
