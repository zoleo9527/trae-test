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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
let AuditService = class AuditService {
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async createLog(logData, operator) {
        const log = new entities_1.AuditLog();
        log.module = logData.module;
        log.recordId = logData.recordId;
        log.action = logData.action;
        log.actionDescription = logData.actionDescription;
        log.oldValues = logData.oldValues;
        log.newValues = logData.newValues;
        log.ipAddress = logData.ipAddress;
        log.userAgent = logData.userAgent;
        if (operator) {
            log.operatorId = operator.id;
            log.operatorName = operator.realName;
            log.createdBy = operator.id;
        }
        return this.auditLogRepository.save(log);
    }
    async logCreate(module, recordId, newValues, operator, ipAddress) {
        return this.createLog({
            module,
            recordId,
            action: entities_1.AuditAction.CREATE,
            actionDescription: `创建${module}记录`,
            newValues,
            ipAddress,
        }, operator);
    }
    async logUpdate(module, recordId, oldValues, newValues, operator, ipAddress) {
        const changes = this.getChangedFields(oldValues, newValues);
        return this.createLog({
            module,
            recordId,
            action: entities_1.AuditAction.UPDATE,
            actionDescription: `更新${module}记录，修改字段: ${Object.keys(changes).join(', ')}`,
            oldValues: changes.old,
            newValues: changes.new,
            ipAddress,
        }, operator);
    }
    async logDelete(module, recordId, oldValues, operator, ipAddress) {
        return this.createLog({
            module,
            recordId,
            action: entities_1.AuditAction.DELETE,
            actionDescription: `删除${module}记录`,
            oldValues,
            ipAddress,
        }, operator);
    }
    async logStatusChange(module, recordId, fromStatus, toStatus, reason, operator, ipAddress) {
        return this.createLog({
            module,
            recordId,
            action: entities_1.AuditAction.STATUS_CHANGE,
            actionDescription: `状态变更: ${fromStatus} -> ${toStatus}${reason ? `, 原因: ${reason}` : ''}`,
            oldValues: { status: fromStatus },
            newValues: { status: toStatus, reason },
            ipAddress,
        }, operator);
    }
    async logHandover(module, recordId, handoverType, description, operator, ipAddress) {
        return this.createLog({
            module,
            recordId,
            action: entities_1.AuditAction.HANDOVER,
            actionDescription: `货品交接[${handoverType}]: ${description}`,
            newValues: { handoverType, description },
            ipAddress,
        }, operator);
    }
    async logApproval(module, recordId, approved, reason, operator, ipAddress) {
        return this.createLog({
            module,
            recordId,
            action: approved ? entities_1.AuditAction.APPROVE : entities_1.AuditAction.REJECT,
            actionDescription: `${approved ? '审批通过' : '审批拒绝'}${reason ? `: ${reason}` : ''}`,
            newValues: { approved, reason },
            ipAddress,
        }, operator);
    }
    async getLogsByRecord(module, recordId) {
        return this.auditLogRepository.find({
            where: { module, recordId, isDeleted: false },
            order: { createdAt: 'DESC' },
            relations: ['operator'],
        });
    }
    async getLogsByOperator(operatorId) {
        return this.auditLogRepository.find({
            where: { operatorId, isDeleted: false },
            order: { createdAt: 'DESC' },
        });
    }
    getChangedFields(oldValues, newValues) {
        const oldChanged = {};
        const newChanged = {};
        const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
        for (const key of allKeys) {
            if (oldValues[key] !== newValues[key]) {
                oldChanged[key] = oldValues[key];
                newChanged[key] = newValues[key];
            }
        }
        return { old: oldChanged, new: newChanged };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map