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
const audit_log_entity_1 = require("./audit-log.entity");
let AuditService = class AuditService {
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async log(entityType, entityId, action, oldValue, newValue, operatorId, operatorName, remark) {
        const changedFields = this.getChangedFields(oldValue, newValue);
        const log = this.auditLogRepository.create({
            entityType,
            entityId,
            action,
            oldValue,
            newValue,
            changedFields,
            operatorId,
            operatorName,
            remark,
        });
        return this.auditLogRepository.save(log);
    }
    getChangedFields(oldValue, newValue) {
        if (!oldValue || !newValue)
            return [];
        const changed = [];
        const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
        for (const key of allKeys) {
            if (oldValue[key] !== newValue[key]) {
                changed.push(key);
            }
        }
        return changed;
    }
    async findByEntity(entityType, entityId) {
        return this.auditLogRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
        });
    }
    async findByOperator(operatorId) {
        return this.auditLogRepository.find({
            where: { operatorId },
            order: { createdAt: 'DESC' },
        });
    }
    async findAll(page = 1, limit = 20) {
        const [data, total] = await this.auditLogRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map