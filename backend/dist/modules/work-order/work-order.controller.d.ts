import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
export declare class WorkOrderController {
    private readonly workOrderService;
    constructor(workOrderService: WorkOrderService);
    create(createDto: CreateWorkOrderDto): Promise<import("./work-order.entity").WorkOrder>;
    findAll(query: QueryWorkOrderDto): Promise<{
        data: import("./work-order.entity").WorkOrder[];
        total: number;
    }>;
    getOverview(consultantId?: string): Promise<any>;
    findOne(id: string): Promise<import("./work-order.entity").WorkOrder>;
    updateStatus(id: string, updateDto: UpdateWorkOrderStatusDto): Promise<import("./work-order.entity").WorkOrder>;
}
