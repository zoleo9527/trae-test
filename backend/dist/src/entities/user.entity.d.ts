import { UserRole } from '../common/enums/role.enum';
import { WorkOrder } from './work-order.entity';
export declare class User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    phone: string;
    station: string;
    reportedOrders: WorkOrder[];
    handledOrders: WorkOrder[];
    createdAt: Date;
    updatedAt: Date;
}
