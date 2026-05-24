import { Repository } from 'typeorm';
import { Refund } from './refund.entity';
import { RefundStatus } from '../../common/enums/refund-status.enum';
import { WorkOrderService } from '../work-order/work-order.service';
import { AuditService } from '../audit/audit.service';
export declare class RefundService {
    private readonly refundRepository;
    private readonly workOrderService;
    private readonly auditService;
    constructor(refundRepository: Repository<Refund>, workOrderService: WorkOrderService, auditService: AuditService);
    create(data: Partial<Refund>, operatorId: string, operatorName: string): Promise<Refund>;
    findAll(page?: number, limit?: number, filters?: {
        status?: RefundStatus;
        workOrderId?: string;
        initiatorId?: string;
    }): Promise<{
        data: Refund[];
        total: number;
    }>;
    findOne(id: string): Promise<Refund>;
    updateStatus(id: string, newStatus: RefundStatus, operatorId: string, operatorName: string, data?: {
        rejectionReason?: string;
        approvedAmount?: number;
        reviewerId?: string;
    }): Promise<Refund>;
    addNegotiationHistory(id: string, history: string, operatorId: string, operatorName: string): Promise<Refund>;
    update(id: string, data: Partial<Refund>, operatorId: string, operatorName: string): Promise<Refund>;
}
