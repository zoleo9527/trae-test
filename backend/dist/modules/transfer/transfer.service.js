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
exports.TransferService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transfer_entity_1 = require("./transfer.entity");
const transfer_status_enum_1 = require("../../common/enums/transfer-status.enum");
const transfer_state_machine_1 = require("../../common/state-machines/transfer.state-machine");
const work_order_service_1 = require("../work-order/work-order.service");
const work_order_status_enum_1 = require("../../common/enums/work-order-status.enum");
const business_error_1 = require("../../common/errors/business-error");
const audit_service_1 = require("../audit/audit.service");
let TransferService = class TransferService {
    constructor(transferRepository, workOrderService, auditService) {
        this.transferRepository = transferRepository;
        this.workOrderService = workOrderService;
        this.auditService = auditService;
    }
    async create(data, operatorId, operatorName) {
        const transfer = this.transferRepository.create({
            ...data,
            fromConsultantId: data.fromConsultantId,
            status: transfer_status_enum_1.TransferStatus.INITIATED,
            initiatorId: operatorId,
            createdBy: operatorId,
            updatedBy: operatorId,
        });
        const saved = await this.transferRepository.save(transfer);
        await this.workOrderService.updateStatus(data.workOrderId, work_order_status_enum_1.WorkOrderStatus.TRANSFERRING, operatorId, operatorName, '发起顾问交接');
        await this.auditService.log('Transfer', saved.id, 'CREATE', null, saved, operatorId, operatorName, '创建顾问交接');
        return this.findOne(saved.id);
    }
    async findAll(page = 1, limit = 20, filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.workOrderId)
            where.workOrderId = filters.workOrderId;
        if (filters?.fromConsultantId)
            where.fromConsultantId = filters.fromConsultantId;
        if (filters?.toConsultantId)
            where.toConsultantId = filters.toConsultantId;
        const [data, total] = await this.transferRepository.findAndCount({
            where,
            relations: [
                'workOrder',
                'workOrder.student',
                'fromConsultant',
                'toConsultant',
                'comments',
                'comments.author',
            ],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }
    async findOne(id) {
        const transfer = await this.transferRepository.findOne({
            where: { id },
            relations: [
                'workOrder',
                'workOrder.student',
                'fromConsultant',
                'toConsultant',
                'comments',
                'comments.author',
            ],
        });
        if (!transfer) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.TRANSFER_NOT_FOUND, `交接记录 ${id} 不存在`);
        }
        return transfer;
    }
    async updateStatus(id, newStatus, operatorId, operatorName, data) {
        const transfer = await this.findOne(id);
        const oldStatus = transfer.status;
        transfer_state_machine_1.TransferStateMachine.transition(oldStatus, newStatus);
        const oldValue = { ...transfer };
        transfer.status = newStatus;
        transfer.updatedBy = operatorId;
        if (data?.rejectionReason) {
            transfer.rejectionReason = data.rejectionReason;
        }
        if (newStatus === transfer_status_enum_1.TransferStatus.RECEIVED) {
            transfer.receivedAt = new Date();
        }
        if (newStatus === transfer_status_enum_1.TransferStatus.COMPLETED) {
            transfer.completedAt = new Date();
            await this.workOrderService.update(transfer.workOrderId, {
                currentConsultantId: transfer.toConsultantId,
                previousConsultantId: transfer.fromConsultantId,
            }, operatorId, operatorName);
            await this.workOrderService.updateStatus(transfer.workOrderId, work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, operatorId, operatorName, '顾问交接完成');
        }
        if (newStatus === transfer_status_enum_1.TransferStatus.REJECTED) {
            await this.workOrderService.updateStatus(transfer.workOrderId, work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, operatorId, operatorName, '顾问交接被驳回');
        }
        const saved = await this.transferRepository.save(transfer);
        await this.auditService.log('Transfer', id, 'STATUS_CHANGE', { status: oldStatus }, { status: newStatus }, operatorId, operatorName, `交接状态从 ${oldStatus} 变更为 ${newStatus}`);
        return this.findOne(id);
    }
    async updateHandoverContent(id, data, operatorId, operatorName) {
        const transfer = await this.findOne(id);
        const oldValue = { ...transfer };
        Object.assign(transfer, data, { updatedBy: operatorId });
        const saved = await this.transferRepository.save(transfer);
        await this.auditService.log('Transfer', id, 'UPDATE_HANDOVER', oldValue, saved, operatorId, operatorName, '更新交接内容');
        return this.findOne(id);
    }
};
exports.TransferService = TransferService;
exports.TransferService = TransferService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transfer_entity_1.Transfer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        work_order_service_1.WorkOrderService,
        audit_service_1.AuditService])
], TransferService);
//# sourceMappingURL=transfer.service.js.map