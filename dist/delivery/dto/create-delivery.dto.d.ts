import { DeliveryStatus } from '../entities/delivery.entity';
export declare class CreateDeliveryDto {
    projectId: string;
    projectName: string;
    status?: DeliveryStatus;
    supplierName?: string;
    driverName?: string;
    vehicleNumber?: string;
    expectedDeliveryDate?: string;
    deliveryLocation?: string;
    materials: string;
    totalQuantity?: number;
    qualityCheckNotes?: string;
    damageNotes?: string;
    trackingInfo?: string;
    changeOrderId?: string;
}
