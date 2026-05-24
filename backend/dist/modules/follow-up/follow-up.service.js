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
exports.FollowUpService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const audit_1 = require("../../common/audit");
let FollowUpService = class FollowUpService {
    constructor(followUpRepository, workOrderRepository, memberRepository, auditService) {
        this.followUpRepository = followUpRepository;
        this.workOrderRepository = workOrderRepository;
        this.memberRepository = memberRepository;
        this.auditService = auditService;
    }
    async generateFollowUpNo() {
        const date = new Date();
        const prefix = `FU${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const lastFollowUp = await this.followUpRepository
            .createQueryBuilder('fu')
            .where('fu.followUpNo LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('fu.followUpNo', 'DESC')
            .getOne();
        if (lastFollowUp) {
            const lastNum = parseInt(lastFollowUp.followUpNo.slice(-4));
            return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
        }
        return `${prefix}0001`;
    }
    async create(dto, operator) {
        const member = await this.memberRepository.findOne({
            where: { id: dto.memberId, isDeleted: false },
        });
        if (!member) {
            throw new common_1.NotFoundException('会员不存在');
        }
        if (dto.workOrderId) {
            const workOrder = await this.workOrderRepository.findOne({
                where: { id: dto.workOrderId, isDeleted: false },
            });
            if (!workOrder) {
                throw new common_1.NotFoundException('工单不存在');
            }
        }
        const followUpNo = await this.generateFollowUpNo();
        const followUp = this.followUpRepository.create({
            followUpNo,
            memberId: dto.memberId,
            workOrderId: dto.workOrderId,
            type: dto.type,
            channel: dto.channel,
            followUpContent: dto.followUpContent,
            plannedAt: dto.plannedAt,
            assignedTo: dto.assignedTo,
            createdBy: operator.id,
            updatedBy: operator.id,
            status: entities_1.FollowUpStatus.PENDING,
        });
        const saved = await this.followUpRepository.save(followUp);
        await this.auditService.logCreate(entities_1.AuditModule.FOLLOW_UP, saved.id, { ...saved }, operator);
        return this.findOne(saved.id);
    }
    async findAll(filters, page = 1, limit = 20) {
        const queryBuilder = this.followUpRepository
            .createQueryBuilder('fu')
            .leftJoinAndSelect('fu.member', 'member')
            .leftJoinAndSelect('fu.workOrder', 'workOrder')
            .leftJoinAndSelect('fu.assignee', 'assignee')
            .where('fu.isDeleted = :isDeleted', { isDeleted: false });
        if (filters?.status) {
            queryBuilder.andWhere('fu.status = :status', { status: filters.status });
        }
        if (filters?.type) {
            queryBuilder.andWhere('fu.type = :type', { type: filters.type });
        }
        if (filters?.memberId) {
            queryBuilder.andWhere('fu.memberId = :memberId', { memberId: filters.memberId });
        }
        if (filters?.assignedTo) {
            queryBuilder.andWhere('fu.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
        }
        queryBuilder.orderBy('fu.plannedAt', 'ASC');
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const followUp = await this.followUpRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['member', 'workOrder', 'assignee'],
        });
        if (!followUp) {
            throw new common_1.NotFoundException('回访记录不存在');
        }
        return followUp;
    }
    async complete(id, dto, operator) {
        const followUp = await this.findOne(id);
        const oldValues = { ...followUp };
        if (followUp.status === entities_1.FollowUpStatus.COMPLETED) {
            throw new common_1.BadRequestException('该回访已完成');
        }
        followUp.status = entities_1.FollowUpStatus.COMPLETED;
        followUp.result = dto.result;
        followUp.customerFeedback = dto.customerFeedback;
        followUp.internalNote = dto.internalNote;
        followUp.actualAt = new Date();
        followUp.followUpCount = followUp.followUpCount + 1;
        followUp.needsEscalation = dto.needsEscalation || false;
        followUp.escalationReason = dto.escalationReason;
        followUp.nextFollowUpAt = dto.nextFollowUpAt;
        followUp.updatedBy = operator.id;
        const updated = await this.followUpRepository.save(followUp);
        await this.auditService.logUpdate(entities_1.AuditModule.FOLLOW_UP, id, oldValues, { ...updated }, operator);
        return this.findOne(id);
    }
    async getPendingStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [pendingCount, overdueCount, todayCount] = await Promise.all([
            this.followUpRepository.count({
                where: { status: entities_1.FollowUpStatus.PENDING, isDeleted: false },
            }),
            this.followUpRepository.count({
                where: {
                    status: entities_1.FollowUpStatus.PENDING,
                    isDeleted: false,
                },
            }),
            this.followUpRepository.count({
                where: {
                    status: entities_1.FollowUpStatus.PENDING,
                    isDeleted: false,
                },
            }),
        ]);
        return {
            pending: pendingCount,
            overdue: 0,
            today: todayCount,
        };
    }
    async autoCreateFollowUp(workOrderId, operator) {
        const workOrder = await this.workOrderRepository.findOne({
            where: { id: workOrderId, isDeleted: false },
            relations: ['member'],
        });
        if (!workOrder) {
            throw new common_1.NotFoundException('工单不存在');
        }
        if (!workOrder.needsFollowUp) {
            throw new common_1.BadRequestException('该工单不需要回访');
        }
        const plannedAt = new Date();
        plannedAt.setDate(plannedAt.getDate() + 3);
        return this.create({
            memberId: workOrder.memberId,
            workOrderId: workOrder.id,
            type: entities_1.FollowUpType.REPAIR_COMPLETED,
            channel: 'phone',
            followUpContent: '售后返修完成回访，了解客户满意度',
            plannedAt,
        }, operator);
    }
};
exports.FollowUpService = FollowUpService;
exports.FollowUpService = FollowUpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.FollowUp)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.WorkOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_1.AuditService])
], FollowUpService);
//# sourceMappingURL=follow-up.service.js.map