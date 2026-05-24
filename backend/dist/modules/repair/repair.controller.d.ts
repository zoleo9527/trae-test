import { RepairService, CreateRepairDto, UpdateRepairDto, ChangeRepairStatusDto, UpdateStepDto } from './repair.service';
import { User } from '../../database/entities';
export declare class RepairController {
    private readonly repairService;
    constructor(repairService: RepairService);
    create(dto: CreateRepairDto, user: User): Promise<import("../../database/entities").Repair>;
    findAll(status?: string, repairType?: string, workOrderId?: string, technicianId?: string, page?: number, limit?: number): Promise<{
        data: import("../../database/entities").Repair[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByWorkOrderId(workOrderId: string): Promise<import("../../database/entities").Repair[]>;
    findOne(id: string): Promise<import("../../database/entities").Repair>;
    getAvailableTransitions(id: string, user: User): Promise<any[]>;
    update(id: string, dto: UpdateRepairDto, user: User): Promise<import("../../database/entities").Repair>;
    changeStatus(id: string, dto: ChangeRepairStatusDto, user: User): Promise<import("../../database/entities").Repair>;
    addStep(repairId: string, stepDto: any, user: User): Promise<import("../../database/entities").RepairStep[]>;
    updateStep(stepId: string, dto: UpdateStepDto, user: User): Promise<import("../../database/entities").RepairStep>;
}
