import { Repository } from 'typeorm';
import { ChangeOrder } from '../change-order/entities/change-order.entity';
import { SignOff } from '../sign-off/entities/sign-off.entity';
import { User } from '../user/entities/user.entity';
export declare class DashboardService {
    private changeOrderRepository;
    private signOffRepository;
    constructor(changeOrderRepository: Repository<ChangeOrder>, signOffRepository: Repository<SignOff>);
    getOverview(user: User): Promise<{
        pendingChangeOrders: number;
        rejectedChangeOrders: number;
        pendingSignOffs: number;
        needsReview: number;
        totalChangeOrders: number;
    }>;
    private countPendingChangeOrdersForUser;
    private countPendingSignOffsForUser;
    private countNeedsReviewForUser;
    getPendingItems(user: User): Promise<{
        changeOrders: ChangeOrder[];
        signOffs: SignOff[];
    }>;
    private getPendingChangeOrdersForUser;
    private getPendingSignOffsForUser;
    getRejectedItems(user: User): Promise<ChangeOrder[]>;
    getNeedsReview(user: User): Promise<ChangeOrder[]>;
    getStatusStatistics(): Promise<any>;
    getRecentActivity(user: User): Promise<{
        recentChangeOrders: ChangeOrder[];
        recentSignOffs: SignOff[];
    }>;
    getMyTasks(user: User): Promise<{
        pendingSignOffCount: number;
        requestedSignOffs: SignOff[];
        draftChangeOrders: ChangeOrder[];
    }>;
    private countMyPendingSignOffs;
    private getMyRequestedSignOffs;
    private getMyDraftChangeOrders;
}
