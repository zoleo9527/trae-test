import { WorkOrder } from '../work-order/work-order.entity';
import { Refund } from '../refund/refund.entity';
import { Transfer } from '../transfer/transfer.entity';
import { Material } from '../material/material.entity';
import { Consultant } from '../consultant/consultant.entity';
export declare class Comment {
    id: string;
    workOrderId: string;
    workOrder: WorkOrder;
    refundId: string;
    refund: Refund;
    transferId: string;
    transfer: Transfer;
    materialId: string;
    material: Material;
    content: string;
    authorId: string;
    author: Consultant;
    isPrivate: boolean;
    createdAt: Date;
}
