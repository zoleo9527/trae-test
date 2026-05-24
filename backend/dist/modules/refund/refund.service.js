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
exports.RefundService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const refund_entity_1 = require("./refund.entity");
const refund_status_enum_1 = require("../../common/enums/refund-status.enum");
const refund_state_machine_1 = require("../../common/state-machines/refund.state-machine");
const work_order_service_1 = require("../work-order/work-order.service");
const work_order_status_enum_1 = require("../../common/enums/work-order-status.enum");
const business_error_1 = require("../../common/errors/business-error");
const audit_service_1 = require("../audit/audit.service");
let RefundService = class RefundService {
    constructor(refundRepository, workOrderService, auditService) {
        this.refundRepository = refundRepository;
        this.workOrderService = workOrderService;
        this.auditService = auditService;
    }
    async create(data, operatorId, operatorName) {
        const refund = this.refundRepository.create({
            ...data,
            status: refund_status_enum_1.RefundStatus.DRAFT,
            initiatorId: operatorId,
            createdBy: operatorId,
            updatedBy: operatorId,
        });
        const saved = await this.refundRepository.save(refund);
        await this.workOrderService.updateStatus(data.workOrderId, work_order_status_enum_1.WorkOrderStatus.REFUND_NEGOTIATING, operatorId, operatorName, '发起退款申请');
        await this.auditService.log('Refund', saved.id, 'CREATE', null, saved, operatorId, operatorName, '创建退款申请');
        return this.findOne(saved.id);
    }
    async findAll(page = 1, limit = 20, filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.workOrderId)
            where.workOrderId = filters.workOrderId;
        if (filters?.initiatorId)
            where.initiatorId = filters.initiatorId;
        const [data, total] = await this.refundRepository.findAndCount({
            where,
            relations: ['workOrder', 'initiator', 'reviewer', 'comments', 'comments.author'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }
    async findOne(id) {
        const refund = await this.refundRepository.findOne({
            where: { id },
            relations: [
                'workOrder',
                'workOrder.student',
                'initiator',
                'reviewer',
                'comments',
                'comments.author',
            ],
        });
        if (!refund) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.REFUND_NOT_FOUND, `退款申请 ${id} 不存在`);
        }
        return refund;
    }
    async updateStatus(id, newStatus, operatorId, operatorName, data) {
        const refund = await this.findOne(id);
        const oldStatus = refund.status;
        refund_state_machine_1.RefundStateMachine.transition(oldStatus, newStatus);
        const oldValue = { ...refund };
        refund.status = newStatus;
        refund.updatedBy = operatorId;
        if (data?.rejectionReason) {
            refund.rejectionReason = data.rejectionReason;
        }
        if (data?.approvedAmount !== undefined) {
            refund.approvedAmount = data.approvedAmount;
        }
        if (data?.reviewerId) {
            refund.reviewerId = data.reviewerId;
            refund.reviewedAt = new Date();
        }
        if (newStatus === refund_status_enum_1.RefundStatus.COMPLETED) {
            refund.completedAt = new Date();
            await this.workOrderService.updateStatus(refund.workOrderId, work_order_status_enum_1.WorkOrderStatus.REFUNDED, operatorId, operatorName, '退款完成');
        }
        const saved = await this.refundRepository.save(refund);
        await this.auditService.log('Refund', id, 'STATUS_CHANGE', { status: oldStatus }, { status: newStatus }, operatorId, operatorName, `退款状态从 ${oldStatus} 变更为 ${newStatus}`);
        return this.findOne(id);
    }
    async addNegotiationHistory(id, history, operatorId, operatorName) {
        const refund = await this.findOne(id);
        const oldValue = { ...refund };
        const timestamp = new Date().toISOString();
        const newEntry = `[${timestamp}] ${operatorName}: ${history}`;
        refund.negotiationHistory = refund.negotiationHistory
            ? `${refund.negotiationHistory}\n${newEntry}`
            : newEntry;
        refund.updatedBy = operatorId;
        const saved = await this.refundRepository.save(refund);
        await this.auditService.log('Refund', id, 'ADD_NEGOTIATION', oldValue, saved, operatorId, operatorName, '添加协商记录');
        return saved;
    }
    async update(id, data, operatorId, operatorName) {
        const refund = await this.findOne(id);
        const oldValue = { ...refund };
        Object.assign(refund, data, { updatedBy: operatorId });
        const saved = await this.refundRepository.save(refund);
        await this.auditService.log('Refund', id, 'UPDATE', oldValue, saved, operatorId, operatorName, '更新退款申请');
        return this.findOne(id);
    }
};
exports.RefundService = RefundService;
exports.RefundService = RefundService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(refund_entity_1.Refund)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        work_order_service_1.WorkOrderService,
        audit_service_1.AuditService])
], RefundService);
//# sourceMappingURL=refund.service.js.map