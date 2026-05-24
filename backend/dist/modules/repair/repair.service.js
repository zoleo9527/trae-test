"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const state_machine_1 = require("../../common/state-machine");
const audit_1 = require("../../common/audit");
let RepairService = class RepairService {
    constructor(repairRepository, repairStepRepository, workOrderRepository, stateMachine, auditService, dataSource) {
        this.repairRepository = repairRepository;
        this.repairStepRepository = repairStepRepository;
        this.workOrderRepository = workOrderRepository;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
        this.dataSource = dataSource;
    }
    async generateRepairNo() {
        const date = new Date();
        const prefix = `RP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const lastRepair = await this.repairRepository
            .createQueryBuilder('r')
            .where('r.repairNo LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('r.repairNo', 'DESC')
            .getOne();
        if (lastRepair) {
            const lastNum = parseInt(lastRepair.repairNo.slice(-4));
            return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
        }
        return `${prefix}0001`;
    }
    async create(dto, operator) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const workOrder = await this.workOrderRepository.findOne({
                where: { id: dto.workOrderId, isDeleted: false },
            });
            if (!workOrder) {
                throw new common_1.NotFoundException('工单不存在');
            }
            const repairNo = await this.generateRepairNo();
            const repair = this.repairRepository.create({
                repairNo,
                workOrderId: dto.workOrderId,
                repairType: dto.repairType,
                repairDescription: dto.repairDescription,
                partsCost: dto.partsCost || 0,
                laborCost: dto.laborCost || 0,
                totalCost: (dto.partsCost || 0) + (dto.laborCost || 0),
                isWarranty: dto.isWarranty || false,
                warrantyTerms: dto.warrantyTerms,
                technicianId: dto.technicianId,
                createdBy: operator.id,
                updatedBy: operator.id,
                status: entities_1.RepairStatus.PENDING,
            });
            const savedRepair = await queryRunner.manager.save(repair);
            if (dto.steps && dto.steps.length > 0) {
                const steps = dto.steps.map((step) => this.repairStepRepository.create({
                    ...step,
                    repairId: savedRepair.id,
                    createdBy: operator.id,
                    updatedBy: operator.id,
                }));
                await queryRunner.manager.save(steps);
            }
            await queryRunner.commitTransaction();
            await this.auditService.logCreate(entities_1.AuditModule.REPAIR, savedRepair.id, { ...savedRepair, steps: dto.steps }, operator);
            return this.findOne(savedRepair.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll(filters, page = 1, limit = 20) {
        const queryBuilder = this.repairRepository
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.workOrder', 'workOrder')
            .leftJoinAndSelect('r.technician', 'technician')
            .leftJoinAndSelect('r.steps', 'steps')
            .where('r.isDeleted = :isDeleted', { isDeleted: false });
        if (filters?.status) {
            queryBuilder.andWhere('r.status = :status', { status: filters.status });
        }
        if (filters?.repairType) {
            queryBuilder.andWhere('r.repairType = :repairType', { repairType: filters.repairType });
        }
        if (filters?.workOrderId) {
            queryBuilder.andWhere('r.workOrderId = :workOrderId', { workOrderId: filters.workOrderId });
        }
        if (filters?.technicianId) {
            queryBuilder.andWhere('r.technicianId = :technicianId', { technicianId: filters.technicianId });
        }
        queryBuilder.orderBy('r.createdAt', 'DESC');
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const repair = await this.repairRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['workOrder', 'technician', 'steps', 'steps.operator'],
        });
        if (!repair) {
            throw new common_1.NotFoundException('返修记录不存在');
        }
        return repair;
    }
    async findByWorkOrderId(workOrderId) {
        return this.repairRepository.find({
            where: { workOrderId, isDeleted: false },
            relations: ['technician', 'steps'],
            order: { createdAt: 'DESC' },
        });
    }
    async update(id, dto, operator) {
        const repair = await this.findOne(id);
        const oldValues = { ...repair };
        if (this.stateMachine.isFinalStatus(repair.status)) {
            throw new common_1.BadRequestException('当前状态不允许修改返修记录');
        }
        Object.assign(repair, dto);
        repair.updatedBy = operator.id;
        if (dto.partsCost !== undefined || dto.laborCost !== undefined) {
            repair.totalCost = (repair.partsCost || 0) + (repair.laborCost || 0);
        }
        const updated = await this.repairRepository.save(repair);
        await this.auditService.logUpdate(entities_1.AuditModule.REPAIR, id, oldValues, { ...updated }, operator);
        return this.findOne(id);
    }
    async changeStatus(id, dto, operator) {
        const repair = await this.findOne(id);
        const oldStatus = repair.status;
        this.stateMachine.validateTransition(oldStatus, dto.status, operator.role);
        repair.status = dto.status;
        repair.updatedBy = operator.id;
        if (dto.status === entities_1.RepairStatus.IN_PROGRESS && !repair.startedAt) {
            repair.startedAt = new Date();
        }
        if (dto.status === entities_1.RepairStatus.COMPLETED) {
            repair.completedAt = new Date();
        }
        const updated = await this.repairRepository.save(repair);
        await this.auditService.logStatusChange(entities_1.AuditModule.REPAIR, id, oldStatus, dto.status, dto.reason, operator);
        return this.findOne(id);
    }
    async getAvailableTransitions(id, userRole) {
        const repair = await this.findOne(id);
        return this.stateMachine.getAvailableTransitions(repair.status, userRole);
    }
    validateStepStatusTransition(oldStatus, newStatus) {
        const validTransitions = {
            [entities_1.StepStatus.PENDING]: [entities_1.StepStatus.IN_PROGRESS, entities_1.StepStatus.SKIPPED],
            [entities_1.StepStatus.IN_PROGRESS]: [entities_1.StepStatus.PENDING, entities_1.StepStatus.COMPLETED, entities_1.StepStatus.SKIPPED],
            [entities_1.StepStatus.COMPLETED]: [entities_1.StepStatus.IN_PROGRESS, entities_1.StepStatus.PENDING],
            [entities_1.StepStatus.SKIPPED]: [entities_1.StepStatus.PENDING, entities_1.StepStatus.IN_PROGRESS],
        };
        const allowedTransitions = validTransitions[oldStatus] || [];
        if (!allowedTransitions.includes(newStatus)) {
            throw new common_1.BadRequestException(`不允许从 ${oldStatus} 状态变更为 ${newStatus}`);
        }
    }
    async updateStep(stepId, dto, operator) {
        const step = await this.repairStepRepository.findOne({
            where: { id: stepId, isDeleted: false },
        });
        if (!step) {
            throw new common_1.NotFoundException('维修步骤不存在');
        }
        const oldStatus = step.status;
        const oldValues = { ...step };
        if (dto.status && dto.status !== oldStatus) {
            this.validateStepStatusTransition(oldStatus, dto.status);
            if (dto.status === entities_1.StepStatus.IN_PROGRESS && !step.startedAt) {
                step.startedAt = new Date();
            }
            if (dto.status === entities_1.StepStatus.COMPLETED && !step.completedAt) {
                step.completedAt = new Date();
                step.operatorId = operator.id;
            }
            if (dto.status !== entities_1.StepStatus.COMPLETED && oldStatus === entities_1.StepStatus.COMPLETED) {
                step.completedAt = null;
                step.operatorId = null;
            }
            if (dto.status === entities_1.StepStatus.PENDING && oldStatus !== entities_1.StepStatus.PENDING) {
                step.startedAt = null;
            }
        }
        Object.assign(step, dto);
        step.updatedBy = operator.id;
        const updated = await this.repairStepRepository.save(step);
        await this.auditService.logUpdate(entities_1.AuditModule.REPAIR, step.repairId, { [`step_${step.id}`]: oldValues }, { [`step_${step.id}`]: updated }, operator);
        return updated;
    }
    async addStep(repairId, stepDto, operator) {
        const repair = await this.findOne(repairId);
        if (this.stateMachine.isFinalStatus(repair.status)) {
            throw new common_1.BadRequestException('返修已完成，无法添加步骤');
        }
        const step = this.repairStepRepository.create({
            ...stepDto,
            repairId,
            createdBy: operator.id,
            updatedBy: operator.id,
        });
        const savedStep = await this.repairStepRepository.save(step);
        await this.auditService.logUpdate(entities_1.AuditModule.REPAIR, repairId, {}, { newStep: savedStep }, operator);
        return savedStep;
    }
};
exports.RepairService = RepairService;
exports.RepairService = RepairService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Repair)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.RepairStep)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.WorkOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        state_machine_1.RepairStateMachine,
        audit_1.AuditService,
        typeorm_2.DataSource])
], RepairService);
//# sourceMappingURL=repair.service.js.map