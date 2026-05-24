import { Repository } from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit-log.entity';
export declare class WorkOrderService {
    private readonly workOrderRepository;
    private readonly auditLogRepository;
    private readonly auditService;
    constructor(workOrderRepository: Repository<WorkOrder>, auditLogRepository: Repository<AuditLog>, auditService: AuditService);
    create(data: Partial<WorkOrder>, operatorId: string, operatorName: string): Promise<WorkOrder>;
    findAll(page?: number, limit?: number, filters?: {
        status?: WorkOrderStatus;
        studentId?: string;
        currentConsultantId?: string;
    }): Promise<{
        data: WorkOrder[];
        total: number;
    }>;
    findOne(id: string): Promise<WorkOrder>;
    private getAuditTimeline;
    updateStatus(id: string, newStatus: WorkOrderStatus, operatorId: string, operatorName: string, remark?: string): Promise<WorkOrder>;
    update(id: string, data: Partial<WorkOrder>, operatorId: string, operatorName: string): Promise<WorkOrder>;
    getOverview(consultantId?: string): Promise<any>;
    private generateOrderNo;
}
