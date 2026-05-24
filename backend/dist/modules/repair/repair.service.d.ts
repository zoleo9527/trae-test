import { Repository, DataSource } from 'typeorm';
import { Repair, RepairStatus, RepairType, RepairStep, StepStatus, WorkOrder, User } from '../../database/entities';
import { RepairStateMachine } from '../../common/state-machine';
import { AuditService } from '../../common/audit';
export interface CreateRepairDto {
    workOrderId: string;
    repairType: RepairType;
    repairDescription: string;
    partsCost?: number;
    laborCost?: number;
    isWarranty?: boolean;
    warrantyTerms?: string;
    technicianId?: string;
    steps?: Array<{
        stepOrder: number;
        stepName: string;
        stepDescription?: string;
    }>;
}
export interface UpdateRepairDto {
    repairType?: RepairType;
    repairDescription?: string;
    technicianNote?: string;
    partsCost?: number;
    laborCost?: number;
    isWarranty?: boolean;
    warrantyTerms?: string;
    technicianId?: string;
}
export interface ChangeRepairStatusDto {
    status: RepairStatus;
    reason?: string;
}
export interface UpdateStepDto {
    stepName?: string;
    stepDescription?: string;
    status?: StepStatus;
    operatorNote?: string;
}
export declare class RepairService {
    private repairRepository;
    private repairStepRepository;
    private workOrderRepository;
    private stateMachine;
    private auditService;
    private dataSource;
    constructor(repairRepository: Repository<Repair>, repairStepRepository: Repository<RepairStep>, workOrderRepository: Repository<WorkOrder>, stateMachine: RepairStateMachine, auditService: AuditService, dataSource: DataSource);
    generateRepairNo(): Promise<string>;
    create(dto: CreateRepairDto, operator: User): Promise<Repair>;
    findAll(filters?: {
        status?: RepairStatus;
        repairType?: RepairType;
        workOrderId?: string;
        technicianId?: string;
    }, page?: number, limit?: number): Promise<{
        data: Repair[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Repair>;
    findByWorkOrderId(workOrderId: string): Promise<Repair[]>;
    update(id: string, dto: UpdateRepairDto, operator: User): Promise<Repair>;
    changeStatus(id: string, dto: ChangeRepairStatusDto, operator: User): Promise<Repair>;
    getAvailableTransitions(id: string, userRole: string): Promise<any[]>;
    private validateStepStatusTransition;
    updateStep(stepId: string, dto: UpdateStepDto, operator: User): Promise<RepairStep>;
    addStep(repairId: string, stepDto: any, operator: User): Promise<RepairStep[]>;
}
