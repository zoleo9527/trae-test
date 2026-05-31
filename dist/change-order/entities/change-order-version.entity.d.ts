import { BaseEntity } from '../../common/entities/base.entity';
import { ChangeOrder } from './change-order.entity';
import { User } from '../../user/entities/user.entity';
export declare class ChangeOrderVersion extends BaseEntity {
    changeOrderId: string;
    changeOrder: ChangeOrder;
    versionNumber: number;
    snapshotData: Record<string, any>;
    changeSummary?: string;
    changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
    }>;
    createdById: string;
    createdBy: User;
}
