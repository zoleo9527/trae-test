import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Repair,
  RepairStatus,
  RepairType,
  RepairStep,
  StepStatus,
  WorkOrder,
  User,
  AuditModule,
} from '../../database/entities';
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

@Injectable()
export class RepairService {
  constructor(
    @InjectRepository(Repair)
    private repairRepository: Repository<Repair>,
    @InjectRepository(RepairStep)
    private repairStepRepository: Repository<RepairStep>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    private stateMachine: RepairStateMachine,
    private auditService: AuditService,
    private dataSource: DataSource,
  ) {}

  async generateRepairNo(): Promise<string> {
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

  async create(dto: CreateRepairDto, operator: User): Promise<Repair> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id: dto.workOrderId, isDeleted: false },
      });
      if (!workOrder) {
        throw new NotFoundException('工单不存在');
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
        status: RepairStatus.PENDING,
      });

      const savedRepair = await queryRunner.manager.save(repair);

      if (dto.steps && dto.steps.length > 0) {
        const steps = dto.steps.map((step) =>
          this.repairStepRepository.create({
            ...step,
            repairId: savedRepair.id,
            createdBy: operator.id,
            updatedBy: operator.id,
          }),
        );
        await queryRunner.manager.save(steps);
      }

      await queryRunner.commitTransaction();

      await this.auditService.logCreate(
        AuditModule.REPAIR,
        savedRepair.id,
        { ...savedRepair, steps: dto.steps },
        operator,
      );

      return this.findOne(savedRepair.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    filters?: {
      status?: RepairStatus;
      repairType?: RepairType;
      workOrderId?: string;
      technicianId?: string;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: Repair[]; total: number; page: number; limit: number }> {
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

  async findOne(id: string): Promise<Repair> {
    const repair = await this.repairRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['workOrder', 'technician', 'steps', 'steps.operator'],
    });

    if (!repair) {
      throw new NotFoundException('返修记录不存在');
    }

    return repair;
  }

  async findByWorkOrderId(workOrderId: string): Promise<Repair[]> {
    return this.repairRepository.find({
      where: { workOrderId, isDeleted: false },
      relations: ['technician', 'steps'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateRepairDto, operator: User): Promise<Repair> {
    const repair = await this.findOne(id);
    const oldValues = { ...repair };

    if (this.stateMachine.isFinalStatus(repair.status)) {
      throw new BadRequestException('当前状态不允许修改返修记录');
    }

    Object.assign(repair, dto);
    repair.updatedBy = operator.id;

    if (dto.partsCost !== undefined || dto.laborCost !== undefined) {
      repair.totalCost = (repair.partsCost || 0) + (repair.laborCost || 0);
    }

    const updated = await this.repairRepository.save(repair);

    await this.auditService.logUpdate(
      AuditModule.REPAIR,
      id,
      oldValues,
      { ...updated },
      operator,
    );

    return this.findOne(id);
  }

  async changeStatus(id: string, dto: ChangeRepairStatusDto, operator: User): Promise<Repair> {
    const repair = await this.findOne(id);
    const oldStatus = repair.status;

    this.stateMachine.validateTransition(oldStatus, dto.status, operator.role);

    repair.status = dto.status;
    repair.updatedBy = operator.id;

    if (dto.status === RepairStatus.IN_PROGRESS && !repair.startedAt) {
      repair.startedAt = new Date();
    }

    if (dto.status === RepairStatus.COMPLETED) {
      repair.completedAt = new Date();
    }

    const updated = await this.repairRepository.save(repair);

    await this.auditService.logStatusChange(
      AuditModule.REPAIR,
      id,
      oldStatus,
      dto.status,
      dto.reason,
      operator,
    );

    return this.findOne(id);
  }

  async getAvailableTransitions(id: string, userRole: string): Promise<any[]> {
    const repair = await this.findOne(id);
    return this.stateMachine.getAvailableTransitions(repair.status, userRole as any);
  }

  private validateStepStatusTransition(oldStatus: StepStatus, newStatus: StepStatus): void {
    const validTransitions: Record<StepStatus, StepStatus[]> = {
      [StepStatus.PENDING]: [StepStatus.IN_PROGRESS, StepStatus.SKIPPED],
      [StepStatus.IN_PROGRESS]: [StepStatus.PENDING, StepStatus.COMPLETED, StepStatus.SKIPPED],
      [StepStatus.COMPLETED]: [StepStatus.IN_PROGRESS, StepStatus.PENDING],
      [StepStatus.SKIPPED]: [StepStatus.PENDING, StepStatus.IN_PROGRESS],
    };

    const allowedTransitions = validTransitions[oldStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `不允许从 ${oldStatus} 状态变更为 ${newStatus}`,
      );
    }
  }

  async updateStep(stepId: string, dto: UpdateStepDto, operator: User): Promise<RepairStep> {
    const step = await this.repairStepRepository.findOne({
      where: { id: stepId, isDeleted: false },
    });

    if (!step) {
      throw new NotFoundException('维修步骤不存在');
    }

    const oldStatus = step.status;
    const oldValues = { ...step };

    if (dto.status && dto.status !== oldStatus) {
      this.validateStepStatusTransition(oldStatus, dto.status);

      if (dto.status === StepStatus.IN_PROGRESS && !step.startedAt) {
        step.startedAt = new Date();
      }

      if (dto.status === StepStatus.COMPLETED && !step.completedAt) {
        step.completedAt = new Date();
        step.operatorId = operator.id;
      }

      if (dto.status !== StepStatus.COMPLETED && oldStatus === StepStatus.COMPLETED) {
        step.completedAt = null as any;
        step.operatorId = null as any;
      }

      if (dto.status === StepStatus.PENDING && oldStatus !== StepStatus.PENDING) {
        step.startedAt = null as any;
      }
    }

    Object.assign(step, dto);
    step.updatedBy = operator.id;

    const updated = await this.repairStepRepository.save(step);

    await this.auditService.logUpdate(
      AuditModule.REPAIR,
      step.repairId,
      { [`step_${step.id}`]: oldValues },
      { [`step_${step.id}`]: updated },
      operator,
    );

    return updated;
  }

  async addStep(repairId: string, stepDto: any, operator: User) {
    const repair = await this.findOne(repairId);

    if (this.stateMachine.isFinalStatus(repair.status)) {
      throw new BadRequestException('返修已完成，无法添加步骤');
    }

    const step = this.repairStepRepository.create({
      ...stepDto,
      repairId,
      createdBy: operator.id,
      updatedBy: operator.id,
    });

    const savedStep = await this.repairStepRepository.save(step);

    await this.auditService.logUpdate(
      AuditModule.REPAIR,
      repairId,
      {},
      { newStep: savedStep },
      operator,
    );

    return savedStep;
  }
}
