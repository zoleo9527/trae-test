import { ChangeOrderService } from './change-order.service';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { StatusTransitionDto } from './dto/status-transition.dto';
import { ChangeOrderStatus } from '../common/enums/change-order-status.enum';
export declare class ChangeOrderController {
    private readonly changeOrderService;
    constructor(changeOrderService: ChangeOrderService);
    create(req: any, createChangeOrderDto: CreateChangeOrderDto): Promise<import("./entities/change-order.entity").ChangeOrder>;
    findAll(page?: number, limit?: number, status?: ChangeOrderStatus, projectId?: string): Promise<{
        data: import("./entities/change-order.entity").ChangeOrder[];
        total: number;
        page: number;
        limit: number;
    }>;
    getPending(req: any): Promise<import("./entities/change-order.entity").ChangeOrder[]>;
    getRejected(req: any): Promise<import("./entities/change-order.entity").ChangeOrder[]>;
    getNeedsReview(req: any): Promise<import("./entities/change-order.entity").ChangeOrder[]>;
    getStatistics(): Promise<any>;
    findOne(id: string): Promise<import("./entities/change-order.entity").ChangeOrder>;
    getVersions(id: string): Promise<import("./entities/change-order-version.entity").ChangeOrderVersion[]>;
    getVersion(id: string, versionNumber: number): Promise<import("./entities/change-order-version.entity").ChangeOrderVersion>;
    update(req: any, id: string, updateChangeOrderDto: UpdateChangeOrderDto): Promise<import("./entities/change-order.entity").ChangeOrder>;
    transitionStatus(req: any, id: string, transitionDto: StatusTransitionDto): Promise<import("./entities/change-order.entity").ChangeOrder>;
}
