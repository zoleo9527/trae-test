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
const work_order_entity_1 = require("./work-order.entity");
const work_order_state_machine_1 = require("../../common/state-machines/work-order.state-machine");
const business_error_1 = require("../../common/errors/business-error");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/audit-log.entity");
let WorkOrderService = class WorkOrderService {
    constructor(workOrderRepository, auditLogRepository, auditService) {
        this.workOrderRepository = workOrderRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }
    async create(data, operatorId, operatorName) {
        const orderNo = await this.generateOrderNo();
        const workOrder = this.workOrderRepository.create({
            ...data,
            orderNo,
            createdBy: operatorId,
            updatedBy: operatorId,
        });
        const saved = await this.workOrderRepository.save(workOrder);
        await this.auditService.log('WorkOrder', saved.id, 'CREATE', null, saved, operatorId, operatorName, '创建工单');
        return saved;
    }
    async findAll(page = 1, limit = 20, filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.studentId)
            where.studentId = filters.studentId;
        if (filters?.currentConsultantId)
            where.currentConsultantId = filters.currentConsultantId;
        const [data, total] = await this.workOrderRepository.findAndCount({
            where,
            relations: ['student', 'currentConsultant', 'previousConsultant'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }
    async findOne(id) {
        const workOrder = await this.workOrderRepository.findOne({
            where: { id },
            relations: [
                'student',
                'currentConsultant',
                'previousConsultant',
                'refunds',
                'refunds.initiator',
                'refunds.reviewer',
                'refunds.comments',
                'refunds.comments.author',
                'transfers',
                'transfers.fromConsultant',
                'transfers.toConsultant',
                'transfers.comments',
                'transfers.comments.author',
                'materials',
                'materials.owner',
                'materials.versions',
                'materials.versions.uploader',
                'materials.comments',
                'materials.comments.author',
                'comments',
                'comments.author',
                'deadlines',
                'deadlines.assignee',
            ],
        });
        if (!workOrder) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.WORK_ORDER_NOT_FOUND, `工单 ${id} 不存在`);
        }
        const auditTimeline = await this.getAuditTimeline(id);
        workOrder.auditTimeline = auditTimeline;
        return workOrder;
    }
    async getAuditTimeline(workOrderId) {
        const allLogs = [];
        const workOrderLogs = await this.auditLogRepository.find({
            where: { entityType: 'WorkOrder', entityId: workOrderId },
            order: { createdAt: 'DESC' },
        });
        allLogs.push(...workOrderLogs);
        const relatedEntityTypes = ['Refund', 'Transfer', 'Material', 'Comment', 'Deadline'];
        for (const entityType of relatedEntityTypes) {
            const logs = await this.auditLogRepository
                .createQueryBuilder('log')
                .where('log.entityType = :entityType', { entityType })
                .andWhere(`(log.newValue->>'workOrderId' = :workOrderId OR log.oldValue->>'workOrderId' = :workOrderId)`, { workOrderId })
                .orderBy('log.createdAt', 'DESC')
                .getMany();
            allLogs.push(...logs);
        }
        return allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async updateStatus(id, newStatus, operatorId, operatorName, remark) {
        const workOrder = await this.findOne(id);
        const oldStatus = workOrder.status;
        work_order_state_machine_1.WorkOrderStateMachine.transition(oldStatus, newStatus);
        const oldValue = { ...workOrder };
        workOrder.status = newStatus;
        workOrder.updatedBy = operatorId;
        const saved = await this.workOrderRepository.save(workOrder);
        await this.auditService.log('WorkOrder', id, 'STATUS_CHANGE', { status: oldStatus }, { status: newStatus }, operatorId, operatorName, remark || `状态从 ${oldStatus} 变更为 ${newStatus}`);
        return saved;
    }
    async update(id, data, operatorId, operatorName) {
        const workOrder = await this.findOne(id);
        const oldValue = { ...workOrder };
        Object.assign(workOrder, data, { updatedBy: operatorId });
        const saved = await this.workOrderRepository.save(workOrder);
        await this.auditService.log('WorkOrder', id, 'UPDATE', oldValue, saved, operatorId, operatorName, '更新工单信息');
        return saved;
    }
    async getOverview(consultantId) {
        const where = {};
        if (consultantId)
            where.currentConsultantId = consultantId;
        const statusCounts = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .select('workOrder.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where(where)
            .groupBy('workOrder.status')
            .getRawMany();
        const total = await this.workOrderRepository.count({ where });
        return {
            total,
            byStatus: statusCounts.reduce((acc, item) => {
                acc[item.status] = parseInt(item.count);
                return acc;
            }, {}),
        };
    }
    async generateOrderNo() {
        const date = new Date();
        const prefix = `WO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const lastOrder = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .where('workOrder.orderNo LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('workOrder.orderNo', 'DESC')
            .getOne();
        let sequence = 1;
        if (lastOrder) {
            const lastSeq = parseInt(lastOrder.orderNo.slice(-4));
            sequence = lastSeq + 1;
        }
        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }
};
exports.WorkOrderService = WorkOrderService;
exports.WorkOrderService = WorkOrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], WorkOrderService);
//# sourceMappingURL=work-order.service.js.map