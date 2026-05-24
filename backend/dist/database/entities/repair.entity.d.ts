import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { RepairStep } from './repair-step.entity';
export declare enum RepairType {
    POLISHING = "polishing",
    SOLDERING = "soldering",
    RESIZING = "resizing",
    STONE_REPLACEMENT = "stone_replacement",
    CHAIN_REPAIR = "chain_repair",
    CLASP_REPAIR = "clasp_repair",
    REFURBISHMENT = "refurbishment",
    CUSTOM_MODIFICATION = "custom_modification",
    OTHER = "other"
}
export declare enum RepairStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    NEEDS_QUOTATION = "needs_quotation",
    QUOTATION_APPROVED = "quotation_approved",
    QUOTATION_REJECTED = "quotation_rejected",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class Repair extends BaseEntity {
    workOrderId: string;
    workOrder: WorkOrder;
    repairNo: string;
    repairType: RepairType;
    status: RepairStatus;
    repairDescription: string;
    technicianNote: string;
    partsCost: number;
    laborCost: number;
    totalCost: number;
    isWarranty: boolean;
    warrantyTerms: string;
    startedAt: Date;
    completedAt: Date;
    technicianId: string;
    steps: RepairStep[];
}
