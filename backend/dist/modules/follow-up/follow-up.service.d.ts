import { Repository } from 'typeorm';
import { FollowUp, FollowUpStatus, FollowUpType, WorkOrder, User, Member } from '../../database/entities';
import { AuditService } from '../../common/audit';
export interface CreateFollowUpDto {
    memberId: string;
    workOrderId?: string;
    type: FollowUpType;
    channel: string;
    followUpContent: string;
    plannedAt: Date;
    assignedTo?: string;
}
export interface CompleteFollowUpDto {
    result: string;
    customerFeedback?: string;
    internalNote?: string;
    needsEscalation?: boolean;
    escalationReason?: string;
    nextFollowUpAt?: Date;
}
export declare class FollowUpService {
    private followUpRepository;
    private workOrderRepository;
    private memberRepository;
    private auditService;
    constructor(followUpRepository: Repository<FollowUp>, workOrderRepository: Repository<WorkOrder>, memberRepository: Repository<Member>, auditService: AuditService);
    generateFollowUpNo(): Promise<string>;
    create(dto: CreateFollowUpDto, operator: User): Promise<FollowUp>;
    findAll(filters?: {
        status?: FollowUpStatus;
        type?: FollowUpType;
        memberId?: string;
        assignedTo?: string;
    }, page?: number, limit?: number): Promise<{
        data: FollowUp[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<FollowUp>;
    complete(id: string, dto: CompleteFollowUpDto, operator: User): Promise<FollowUp>;
    getPendingStats(): Promise<any>;
    autoCreateFollowUp(workOrderId: string, operator: User): Promise<FollowUp>;
}
