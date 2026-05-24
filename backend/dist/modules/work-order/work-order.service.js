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
exports.WorkOrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const state_machine_1 = require("../../common/state-machine");
const audit_1 = require("../../common/audit");
const follow_up_service_1 = require("../follow-up/follow-up.service");
let WorkOrderService = class WorkOrderService {
    constructor(workOrderRepository, workOrderItemRepository, statusHistoryRepository, memberRepository, stateMachine, auditService, followUpService, dataSource) {
        this.workOrderRepository = workOrderRepository;
        this.workOrderItemRepository = workOrderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.memberRepository = memberRepository;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
        this.followUpService = followUpService;
        this.dataSource = dataSource;
    }
    async generateOrderNo() {
        const date = new Date();
        const prefix = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const lastOrder = await this.workOrderRepository
            .createQueryBuilder('wo')
            .where('wo.orderNo LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('wo.orderNo', 'DESC')
            .getOne();
        if (lastOrder) {
            const lastNum = parseInt(lastOrder.orderNo.slice(-4));
            return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
        }
        return `${prefix}0001`;
    }
    async create(dto, operator) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const member = await this.memberRepository.findOne({
                where: { id: dto.memberId, isDeleted: false },
            });
            if (!member) {
                throw new common_1.NotFoundException('会员不存在');
            }
            const orderNo = await this.generateOrderNo();
            const workOrder = this.workOrderRepository.create({
                orderNo,
                type: dto.type,
                priority: dto.priority,
                memberId: dto.memberId,
                problemDescription: dto.problemDescription,
                customerRequirement: dto.customerRequirement,
                internalNote: dto.internalNote,
                estimatedCost: dto.estimatedCost,
                expectedCompletionAt: dto.expectedCompletionAt,
                createdBy: operator.id,
                updatedBy: operator.id,
                status: entities_1.WorkOrderStatus.DRAFT,
            });
            const savedOrder = await queryRunner.manager.save(workOrder);
            if (dto.items && dto.items.length > 0) {
                const items = dto.items.map((item) => this.workOrderItemRepository.create({
                    ...item,
                    workOrderId: savedOrder.id,
                    createdBy: operator.id,
                    updatedBy: operator.id,
                }));
                await queryRunner.manager.save(items);
            }
            await queryRunner.commitTransaction();
            await this.auditService.logCreate(entities_1.AuditModule.WORK_ORDER, savedOrder.id, { ...savedOrder, items: dto.items }, operator);
            return this.findOne(savedOrder.id);
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
        const queryBuilder = this.workOrderRepository
            .createQueryBuilder('wo')
            .leftJoinAndSelect('wo.member', 'member')
            .leftJoinAndSelect('wo.handler', 'handler')
            .leftJoinAndSelect('wo.items', 'items')
            .where('wo.isDeleted = :isDeleted', { isDeleted: false });
        if (filters?.status) {
            queryBuilder.andWhere('wo.status = :status', { status: filters.status });
        }
        if (filters?.type) {
            queryBuilder.andWhere('wo.type = :type', { type: filters.type });
        }
        if (filters?.memberId) {
            queryBuilder.andWhere('wo.memberId = :memberId', { memberId: filters.memberId });
        }
        if (filters?.handlerId) {
            queryBuilder.andWhere('wo.handlerId = :handlerId', { handlerId: filters.handlerId });
        }
        queryBuilder.orderBy('wo.createdAt', 'DESC');
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const workOrder = await this.workOrderRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['member', 'handler', 'items', 'repairs', 'followUps', 'statusHistories', 'statusHistories.operator'],
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('工单不存在');
        }
        return workOrder;
    }
    async update(id, dto, operator) {
        const workOrder = await this.findOne(id);
        const oldValues = { ...workOrder };
        if (workOrder.status !== entities_1.WorkOrderStatus.DRAFT && workOrder.status !== entities_1.WorkOrderStatus.REJECTED) {
            throw new common_1.BadRequestException('当前状态不允许修改工单信息');
        }
        Object.assign(workOrder, dto);
        workOrder.updatedBy = operator.id;
        const updated = await this.workOrderRepository.save(workOrder);
        await this.auditService.logUpdate(entities_1.AuditModule.WORK_ORDER, id, oldValues, { ...updated }, operator);
        return this.findOne(id);
    }
    async changeStatus(id, dto, operator) {
        const workOrder = await this.findOne(id);
        const oldStatus = workOrder.status;
        this.stateMachine.validateTransition(oldStatus, dto.status, operator.role);
        workOrder.status = dto.status;
        workOrder.updatedBy = operator.id;
        if (dto.status === entities_1.WorkOrderStatus.COMPLETED) {
            workOrder.completedAt = new Date();
        }
        const updated = await this.workOrderRepository.save(workOrder);
        const history = this.statusHistoryRepository.create({
            workOrderId: id,
            fromStatus: oldStatus,
            toStatus: dto.status,
            operatorId: operator.id,
            changeReason: dto.reason,
            snapshotData: { workOrder: { ...updated } },
            createdBy: operator.id,
        });
        await this.statusHistoryRepository.save(history);
        await this.auditService.logStatusChange(entities_1.AuditModule.WORK_ORDER, id, oldStatus, dto.status, dto.reason, operator);
        if (dto.status === entities_1.WorkOrderStatus.COMPLETED) {
            try {
                await this.autoCreateFollowUp(id, operator);
            }
            catch (error) {
                console.error('自动创建回访任务失败:', error);
            }
        }
        return this.findOne(id);
    }
    async autoCreateFollowUp(workOrderId, operator) {
        const workOrder = await this.findOne(workOrderId);
        const plannedAt = new Date();
        plannedAt.setDate(plannedAt.getDate() + 3);
        await this.followUpService.create({
            memberId: workOrder.memberId,
            workOrderId: workOrder.id,
            type: entities_1.FollowUpType.REPAIR_COMPLETED,
            channel: 'phone',
            followUpContent: '售后工单完成回访，了解客户满意度和货品使用情况',
            plannedAt,
        }, operator);
    }
    async receiveItem(workOrderId, itemId, dto, operator) {
        const item = await this.workOrderItemRepository.findOne({
            where: { id: itemId, isDeleted: false },
        });
        if (!item) {
            throw new common_1.NotFoundException('工单物品不存在');
        }
        if (item.workOrderId !== workOrderId) {
            throw new common_1.BadRequestException('该物品不属于当前工单');
        }
        if (item.handoverStatus !== entities_1.ItemHandoverStatus.PENDING) {
            throw new common_1.BadRequestException('该物品已接收，无法重复接收');
        }
        const oldValues = { ...item };
        item.handoverStatus = entities_1.ItemHandoverStatus.RECEIVED;
        item.receivedAt = new Date();
        item.receivedBy = operator.id;
        item.conditionAfter = dto.conditionAfter;
        item.imageUrlsAfter = dto.imageUrlsAfter;
        item.handoverRemark = dto.handoverRemark;
        item.updatedBy = operator.id;
        const updated = await this.workOrderItemRepository.save(item);
        await this.auditService.logHandover(entities_1.AuditModule.WORK_ORDER, workOrderId, 'receive', `接收物品: ${item.itemName}${dto.handoverRemark ? `, 备注: ${dto.handoverRemark}` : ''}`, operator);
        await this.auditService.logUpdate(entities_1.AuditModule.WORK_ORDER, workOrderId, { item: oldValues }, { item: updated }, operator);
        return updated;
    }
    async returnItem(workOrderId, itemId, dto, operator) {
        const item = await this.workOrderItemRepository.findOne({
            where: { id: itemId, isDeleted: false },
        });
        if (!item) {
            throw new common_1.NotFoundException('工单物品不存在');
        }
        if (item.workOrderId !== workOrderId) {
            throw new common_1.BadRequestException('该物品不属于当前工单');
        }
        if (item.handoverStatus === entities_1.ItemHandoverStatus.PENDING) {
            throw new common_1.BadRequestException('该物品尚未接收，无法返还');
        }
        if (item.handoverStatus === entities_1.ItemHandoverStatus.RETURNED || item.handoverStatus === entities_1.ItemHandoverStatus.SHIPPED) {
            throw new common_1.BadRequestException('该物品已返还/发货');
        }
        const oldValues = { ...item };
        item.handoverStatus = entities_1.ItemHandoverStatus.RETURNED;
        item.returnedAt = new Date();
        item.returnedBy = operator.id;
        item.conditionAfter = dto.conditionAfter || item.conditionAfter;
        item.imageUrlsAfter = dto.imageUrlsAfter || item.imageUrlsAfter;
        item.handoverRemark = dto.handoverRemark || item.handoverRemark;
        item.updatedBy = operator.id;
        const updated = await this.workOrderItemRepository.save(item);
        await this.auditService.logHandover(entities_1.AuditModule.WORK_ORDER, workOrderId, 'return', `返还物品: ${item.itemName}${dto.handoverRemark ? `, 备注: ${dto.handoverRemark}` : ''}`, operator);
        await this.auditService.logUpdate(entities_1.AuditModule.WORK_ORDER, workOrderId, { item: oldValues }, { item: updated }, operator);
        return updated;
    }
    async getAuditLogs(workOrderId) {
        return this.auditService.getLogsByRecord(entities_1.AuditModule.WORK_ORDER, workOrderId);
    }
    async getDashboardStats() {
        const [pendingCount, inProgressCount, rejectedCount, needsReviewCount, completedCount] = await Promise.all([
            this.workOrderRepository.count({
                where: {
                    status: entities_1.WorkOrderStatus.PENDING_REVIEW,
                    isDeleted: false,
                },
            }),
            this.workOrderRepository.count({
                where: {
                    status: entities_1.WorkOrderStatus.IN_PROGRESS,
                    isDeleted: false,
                },
            }),
            this.workOrderRepository.count({
                where: {
                    status: entities_1.WorkOrderStatus.REJECTED,
                    isDeleted: false,
                },
            }),
            this.workOrderRepository.count({
                where: {
                    status: entities_1.WorkOrderStatus.NEEDS_REVIEW,
                    isDeleted: false,
                },
            }),
            this.workOrderRepository.count({
                where: {
                    status: entities_1.WorkOrderStatus.COMPLETED,
                    isDeleted: false,
                },
            }),
        ]);
        return {
            pendingReview: pendingCount,
            inProgress: inProgressCount,
            rejected: rejectedCount,
            needsReview: needsReviewCount,
            completed: completedCount,
        };
    }
    async getStatusHistories(workOrderId) {
        return this.statusHistoryRepository.find({
            where: { workOrderId },
            order: { createdAt: 'DESC' },
            relations: ['operator'],
        });
    }
};
exports.WorkOrderService = WorkOrderService;
exports.WorkOrderService = WorkOrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.WorkOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkOrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.StatusHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        state_machine_1.WorkOrderStateMachine,
        audit_1.AuditService,
        follow_up_service_1.FollowUpService,
        typeorm_2.DataSource])
], WorkOrderService);
//# sourceMappingURL=work-order.service.js.map