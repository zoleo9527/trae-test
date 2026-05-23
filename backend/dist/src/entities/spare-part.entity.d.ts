import { PartUsage } from './part-usage.entity';
export declare class SparePart {
    id: string;
    partCode: string;
    name: string;
    specification: string;
    manufacturer: string;
    unitPrice: number;
    stockQuantity: number;
    unit: string;
    location: string;
    description: string;
    usages: PartUsage[];
    createdAt: Date;
    updatedAt: Date;
}
