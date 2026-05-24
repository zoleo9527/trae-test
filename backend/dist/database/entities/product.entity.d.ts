import { BaseEntity } from './base.entity';
import { WorkOrderItem } from './work-order-item.entity';
export declare enum ProductCategory {
    RING = "ring",
    NECKLACE = "necklace",
    BRACELET = "bracelet",
    EARRING = "earring",
    PENDANT = "pendant",
    WATCH = "watch",
    OTHER = "other"
}
export declare enum ProductStatus {
    IN_STOCK = "in_stock",
    SOLD = "sold",
    IN_REPAIR = "in_repair",
    TRANSFERRED = "transferred",
    LOST = "lost"
}
export declare class Product extends BaseEntity {
    productNo: string;
    productName: string;
    category: ProductCategory;
    material: string;
    goldContent: string;
    weightGrams: number;
    stoneInfo: string;
    size: string;
    originalPrice: number;
    actualPrice: number;
    status: ProductStatus;
    description: string;
    imageUrls: string;
    workOrderItems: WorkOrderItem[];
}
