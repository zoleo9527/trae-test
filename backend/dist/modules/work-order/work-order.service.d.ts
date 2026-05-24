import { Repository, DataSource } from 'typeorm';
import { WorkOrder, WorkOrderStatus, WorkOrderItem, StatusHistory, User, Member } from '../../database/entities';
import { WorkOrderStateMachine } from '../../common/state-machine';
import { AuditService } from '../../common/audit';
import { FollowUpService } from '../follow-up/follow-up.service';
export interface CreateWorkOrderDto {
    type: string;
    priority: string;
    memberId: string;
    problemDescription: string;
    customerRequirement?: string;
    internalNote?: string;
    estimatedCost?: number;
    expectedCompletionAt?: Date;
    items: Array<{
        productId?: string;
        itemName: string;
        itemSpec?: string;
        quantity: number;
        itemValue?: number;
        conditionBefore?: string;
        imageUrlsBefore?: string;
    }>;
}
export interface UpdateWorkOrderDto {
    type?: string;
    priority?: string;
    problemDescription?: string;
    customerRequirement?: string;
    internalNote?: string;
    estimatedCost?: number;
    expectedCompletionAt?: Date;
    handlerId?: string;
}
export interface ChangeStatusDto {
    status: WorkOrderStatus;
    reason?: string;
}
export interface HandoverItemDto {
    itemId: string;
    conditionAfter?: string;
    imageUrlsAfter?: string;
    handoverRemark?: string;
}
export declare class WorkOrderService {
    private workOrderRepository;
    private workOrderItemRepository;
    private statusHistoryRepository;
    private memberRepository;
    private stateMachine;
    private auditService;
    private followUpService;
    private dataSource;
    constructor(workOrderRepository: Repository<WorkOrder>, workOrderItemRepository: Repository<WorkOrderItem>, statusHistoryRepository: Repository<StatusHistory>, memberRepository: Repository<Member>, stateMachine: WorkOrderStateMachine, auditService: AuditService, followUpService: FollowUpService, dataSource: DataSource);
    generateOrderNo(): Promise<string>;
    create(dto: CreateWorkOrderDto, operator: User): Promise<WorkOrder>;
    findAll(filters?: {
        status?: WorkOrderStatus;
        type?: string;
        memberId?: string;
        handlerId?: string;
    }, page?: number, limit?: number): Promise<{
        data: WorkOrder[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<WorkOrder>;
    update(id: string, dto: UpdateWorkOrderDto, operator: User): Promise<WorkOrder>;
    changeStatus(id: string, dto: ChangeStatusDto, operator: User): Promise<WorkOrder>;
    autoCreateFollowUp(workOrderId: string, operator: User): Promise<void>;
    receiveItem(workOrderId: string, itemId: string, dto: HandoverItemDto, operator: User): Promise<WorkOrderItem>;
    returnItem(workOrderId: string, itemId: string, dto: HandoverItemDto, operator: User): Promise<WorkOrderItem>;
    getAuditLogs(workOrderId: string): Promise<any[]>;
    getDashboardStats(): Promise<any>;
    getStatusHistories(workOrderId: string): Promise<StatusHistory[]>;
}
