import { WorkOrderService, CreateWorkOrderDto, UpdateWorkOrderDto, ChangeStatusDto, HandoverItemDto } from './work-order.service';
import { User, WorkOrder, WorkOrderStatus } from '../../database/entities';
export declare class WorkOrderController {
    private workOrderService;
    constructor(workOrderService: WorkOrderService);
    create(dto: CreateWorkOrderDto, user: User): Promise<WorkOrder>;
    findAll(status?: WorkOrderStatus, type?: string, memberId?: string, handlerId?: string, page?: number, limit?: number): Promise<{
        data: WorkOrder[];
        total: number;
        page: number;
        limit: number;
    }>;
    getDashboardStats(): Promise<any>;
    findOne(id: string): Promise<WorkOrder>;
    update(id: string, dto: UpdateWorkOrderDto, user: User): Promise<WorkOrder>;
    changeStatus(id: string, dto: ChangeStatusDto, user: User): Promise<WorkOrder>;
    getStatusHistories(id: string): Promise<import("../../database/entities").StatusHistory[]>;
    getAuditLogs(id: string): Promise<any[]>;
    receiveItem(workOrderId: string, itemId: string, dto: HandoverItemDto, user: User): Promise<import("../../database/entities").WorkOrderItem>;
    returnItem(workOrderId: string, itemId: string, dto: HandoverItemDto, user: User): Promise<import("../../database/entities").WorkOrderItem>;
}
