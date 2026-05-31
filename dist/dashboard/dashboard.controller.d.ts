import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(req: any): Promise<{
        pendingChangeOrders: number;
        rejectedChangeOrders: number;
        pendingSignOffs: number;
        needsReview: number;
        totalChangeOrders: number;
    }>;
    getPendingItems(req: any): Promise<{
        changeOrders: import("../change-order/entities/change-order.entity").ChangeOrder[];
        signOffs: import("../sign-off/entities/sign-off.entity").SignOff[];
    }>;
    getRejectedItems(req: any): Promise<import("../change-order/entities/change-order.entity").ChangeOrder[]>;
    getNeedsReview(req: any): Promise<import("../change-order/entities/change-order.entity").ChangeOrder[]>;
    getStatusStatistics(): Promise<any>;
    getRecentActivity(req: any): Promise<{
        recentChangeOrders: import("../change-order/entities/change-order.entity").ChangeOrder[];
        recentSignOffs: import("../sign-off/entities/sign-off.entity").SignOff[];
    }>;
    getMyTasks(req: any): Promise<{
        pendingSignOffCount: number;
        requestedSignOffs: import("../sign-off/entities/sign-off.entity").SignOff[];
        draftChangeOrders: import("../change-order/entities/change-order.entity").ChangeOrder[];
    }>;
}
