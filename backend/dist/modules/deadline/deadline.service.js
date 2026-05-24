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
exports.DeadlineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deadline_entity_1 = require("./deadline.entity");
const audit_service_1 = require("../audit/audit.service");
const business_error_1 = require("../../common/errors/business-error");
let DeadlineService = class DeadlineService {
    constructor(deadlineRepository, auditService) {
        this.deadlineRepository = deadlineRepository;
        this.auditService = auditService;
    }
    async create(data, operatorId, operatorName) {
        const deadline = this.deadlineRepository.create({
            ...data,
            isCompleted: false,
            isOverdue: false,
            reminderCount: 0,
        });
        const saved = await this.deadlineRepository.save(deadline);
        await this.auditService.log('Deadline', saved.id, 'CREATE', null, saved, operatorId, operatorName, '创建截止日提醒');
        return saved;
    }
    async findByWorkOrder(workOrderId) {
        return this.deadlineRepository.find({
            where: { workOrderId },
            relations: ['assignee'],
            order: { dueDate: 'ASC' },
        });
    }
    async findUpcoming(days = 7) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return this.deadlineRepository.find({
            where: {
                isCompleted: false,
                isOverdue: false,
                dueDate: (0, typeorm_2.Between)(now, futureDate),
            },
            relations: ['assignee', 'workOrder', 'workOrder.student'],
            order: { dueDate: 'ASC' },
        });
    }
    async markComplete(id, operatorId, operatorName) {
        const deadline = await this.deadlineRepository.findOne({ where: { id } });
        if (!deadline) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.DEADLINE_NOT_FOUND, `截止日 ${id} 不存在`);
        }
        const oldValue = { ...deadline };
        deadline.isCompleted = true;
        deadline.completedAt = new Date();
        const saved = await this.deadlineRepository.save(deadline);
        await this.auditService.log('Deadline', id, 'COMPLETE', oldValue, saved, operatorId, operatorName, '截止日任务完成');
        return saved;
    }
    async checkOverdue() {
        const now = new Date();
        const overdueDeadlines = await this.deadlineRepository.find({
            where: {
                isCompleted: false,
                isOverdue: false,
                dueDate: (0, typeorm_2.LessThan)(now),
            },
            relations: ['assignee', 'workOrder', 'workOrder.student'],
        });
        for (const deadline of overdueDeadlines) {
            deadline.isOverdue = true;
            await this.deadlineRepository.save(deadline);
        }
        return overdueDeadlines;
    }
    async incrementReminder(id) {
        const deadline = await this.deadlineRepository.findOne({ where: { id } });
        if (!deadline) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.DEADLINE_NOT_FOUND, `截止日 ${id} 不存在`);
        }
        deadline.reminderCount += 1;
        deadline.lastReminderAt = new Date();
        return this.deadlineRepository.save(deadline);
    }
};
exports.DeadlineService = DeadlineService;
exports.DeadlineService = DeadlineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(deadline_entity_1.Deadline)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], DeadlineService);
//# sourceMappingURL=deadline.service.js.map