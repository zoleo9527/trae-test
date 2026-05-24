import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { Product } from './product.entity';
export declare enum ItemHandoverStatus {
    PENDING = "pending",
    RECEIVED = "received",
    RETURNED = "returned",
    SHIPPED = "shipped"
}
export declare class WorkOrderItem extends BaseEntity {
    workOrderId: string;
    workOrder: WorkOrder;
    productId: string;
    product: Product;
    itemName: string;
    itemSpec: string;
    quantity: number;
    itemValue: number;
    handoverStatus: ItemHandoverStatus;
    conditionBefore: string;
    conditionAfter: string;
    handoverRemark: string;
    imageUrlsBefore: string;
    imageUrlsAfter: string;
    receivedAt: Date;
    receivedBy: string;
    returnedAt: Date;
    returnedBy: string;
}
