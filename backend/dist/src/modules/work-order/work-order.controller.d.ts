import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, QueryWorkOrderDto, TransitionStatusDto, AssignHandlerDto } from './dto/work-order.dto';
import { ConfirmDowntimeDto, RequestPartDto, ApprovePartDto, ReceivePartDto, CompleteRepairDto, SubmitReviewDto, VerifyReviewDto } from './dto/workflow.dto';
import { WorkOrder } from '../../entities/work-order.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class WorkOrderController {
    private readonly workOrderService;
    constructor(workOrderService: WorkOrderService);
    create(createDto: CreateWorkOrderDto): Promise<WorkOrder>;
    findAll(queryDto: QueryWorkOrderDto): Promise<PaginatedResult<WorkOrder>>;
    getStatistics(): Promise<any>;
    export(queryDto: QueryWorkOrderDto): Promise<{
        filePath: string;
    }>;
    findOne(id: string): Promise<WorkOrder>;
    update(id: string, updateDto: UpdateWorkOrderDto): Promise<WorkOrder>;
    assignHandler(id: string, assignDto: AssignHandlerDto): Promise<WorkOrder>;
    transitionStatus(id: string, transitionDto: TransitionStatusDto): Promise<WorkOrder>;
    confirmDowntime(id: string, dto: ConfirmDowntimeDto): Promise<WorkOrder>;
    requestPart(id: string, dto: RequestPartDto): Promise<WorkOrder>;
    approvePart(id: string, dto: ApprovePartDto): Promise<WorkOrder>;
    receivePart(id: string, dto: ReceivePartDto): Promise<WorkOrder>;
    completeRepair(id: string, dto: CompleteRepairDto): Promise<WorkOrder>;
    submitReview(id: string, dto: SubmitReviewDto): Promise<WorkOrder>;
    verifyReview(id: string, dto: VerifyReviewDto): Promise<WorkOrder>;
    delete(id: string): Promise<void>;
}
