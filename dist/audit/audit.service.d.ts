import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction, AuditEntityType } from '../common/enums/audit.enum';
import { User } from '../user/entities/user.entity';
export interface CreateAuditLogDto {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    entityName?: string;
    user?: User;
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
    metadata?: Record<string, any>;
}
export declare class AuditService {
    private auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    createLog(dto: CreateAuditLogDto): Promise<AuditLog>;
    private getChangedFields;
    findByEntity(entityType: AuditEntityType, entityId: string): Promise<AuditLog[]>;
    findByUser(userId: string, limit?: number): Promise<AuditLog[]>;
    findAll(page?: number, limit?: number, filters?: {
        entityType?: AuditEntityType;
        action?: AuditAction;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        data: AuditLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEntityHistory(entityType: AuditEntityType, entityId: string): Promise<AuditLog[]>;
}
