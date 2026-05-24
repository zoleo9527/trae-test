import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
export declare class AuditService {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(entityType: string, entityId: string, action: string, oldValue: Record<string, any> | null, newValue: Record<string, any> | null, operatorId?: string, operatorName?: string, remark?: string): Promise<AuditLog>;
    private getChangedFields;
    findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
    findByOperator(operatorId: string): Promise<AuditLog[]>;
    findAll(page?: number, limit?: number): Promise<{
        data: AuditLog[];
        total: number;
    }>;
}
