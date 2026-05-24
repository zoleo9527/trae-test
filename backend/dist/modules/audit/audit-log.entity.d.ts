export declare class AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue: Record<string, any>;
    newValue: Record<string, any>;
    changedFields: string[];
    operatorId: string;
    operatorName: string;
    remark: string;
    createdAt: Date;
}
