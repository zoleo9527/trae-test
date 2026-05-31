import { Repository } from 'typeorm';
import { ChangeOrder } from './change-order/entities/change-order.entity';
import { SignOff } from './sign-off/entities/sign-off.entity';
export declare class AppController {
    private changeOrderRepository;
    private signOffRepository;
    constructor(changeOrderRepository: Repository<ChangeOrder>, signOffRepository: Repository<SignOff>);
    getStatus(): {
        name: string;
        version: string;
        status: string;
        docs: string;
        demo: {
            login: string;
            dashboard: string;
            accounts: {
                admin: string;
                project_manager: string;
                supervisor: string;
                foreman: string;
                worker: string;
                accountant: string;
                client: string;
            };
        };
    };
    getHomeData(req: any): Promise<{
        summary: {
            pendingChangeOrders: number;
            rejectedChangeOrders: number;
            pendingSignOffs: number;
            needsReview: number;
            totalChangeOrders: number;
        };
        pending: {
            changeOrders: ChangeOrder[];
            signOffs: SignOff[];
        };
        rejected: {
            changeOrders: ChangeOrder[];
        };
        needsReview: {
            changeOrders: ChangeOrder[];
        };
        statistics: any;
    }>;
    private getPendingChangeOrdersForUser;
    private getPendingSignOffsForUser;
}
