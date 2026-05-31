import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';
export declare enum DeliveryStatus {
    PENDING = "pending",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    RECEIVED = "received",
    PARTIAL_RECEIVED = "partial_received",
    RETURNED = "returned"
}
export declare class Delivery extends BaseEntity {
    deliveryNumber: string;
    projectId: string;
    projectName: string;
    status: DeliveryStatus;
    supplierName?: string;
    driverName?: string;
    vehicleNumber?: string;
    expectedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    deliveryLocation?: string;
    materials: string;
    totalQuantity: number;
    receivedQuantity: number;
    qualityCheckNotes?: string;
    damageNotes?: string;
    trackingInfo?: string;
    changeOrderId?: string;
    changeOrder?: ChangeOrder;
    createdById: string;
    createdBy: User;
    receivedById?: string;
    receivedBy?: User;
    signOffs: SignOff[];
    materialsList?: Array<{
        name: string;
        specification: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
    attachments?: Array<{
        name: string;
        url: string;
        type: string;
    }>;
    metadata?: Record<string, any>;
}
