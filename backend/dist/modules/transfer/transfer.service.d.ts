import { Repository } from 'typeorm';
import { Transfer } from './transfer.entity';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { WorkOrderService } from '../work-order/work-order.service';
import { AuditService } from '../audit/audit.service';
export declare class TransferService {
    private readonly transferRepository;
    private readonly workOrderService;
    private readonly auditService;
    constructor(transferRepository: Repository<Transfer>, workOrderService: WorkOrderService, auditService: AuditService);
    create(data: Partial<Transfer>, operatorId: string, operatorName: string): Promise<Transfer>;
    findAll(page?: number, limit?: number, filters?: {
        status?: TransferStatus;
        workOrderId?: string;
        fromConsultantId?: string;
        toConsultantId?: string;
    }): Promise<{
        data: Transfer[];
        total: number;
    }>;
    findOne(id: string): Promise<Transfer>;
    updateStatus(id: string, newStatus: TransferStatus, operatorId: string, operatorName: string, data?: {
        rejectionReason?: string;
    }): Promise<Transfer>;
    updateHandoverContent(id: string, data: {
        handoverContent?: string;
        keyNotes?: string;
        pendingItems?: string;
    }, operatorId: string, operatorName: string): Promise<Transfer>;
}
