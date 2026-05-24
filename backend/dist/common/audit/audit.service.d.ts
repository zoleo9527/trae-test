import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditModule, User } from '../../database/entities';
export interface AuditLogData {
    module: AuditModule;
    recordId: string;
    action: AuditAction;
    actionDescription: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    private auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    createLog(logData: AuditLogData, operator?: User): Promise<AuditLog>;
    logCreate(module: AuditModule, recordId: string, newValues: Record<string, any>, operator?: User, ipAddress?: string): Promise<AuditLog>;
    logUpdate(module: AuditModule, recordId: string, oldValues: Record<string, any>, newValues: Record<string, any>, operator?: User, ipAddress?: string): Promise<AuditLog>;
    logDelete(module: AuditModule, recordId: string, oldValues: Record<string, any>, operator?: User, ipAddress?: string): Promise<AuditLog>;
    logStatusChange(module: AuditModule, recordId: string, fromStatus: string, toStatus: string, reason?: string, operator?: User, ipAddress?: string): Promise<AuditLog>;
    logHandover(module: AuditModule, recordId: string, handoverType: string, description: string, operator?: User, ipAddress?: string): Promise<AuditLog>;
    logApproval(module: AuditModule, recordId: string, approved: boolean, reason?: string, operator?: User, ipAddress?: string): Promise<AuditLog>;
    getLogsByRecord(module: AuditModule, recordId: string): Promise<AuditLog[]>;
    getLogsByOperator(operatorId: string): Promise<AuditLog[]>;
    private getChangedFields;
}
