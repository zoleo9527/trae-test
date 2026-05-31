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
const audit_log_entity_1 = require("./entities/audit-log.entity");
let AuditService = class AuditService {
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async createLog(dto) {
        const log = this.auditLogRepository.create({
            action: dto.action,
            entityType: dto.entityType,
            entityId: dto.entityId,
            entityName: dto.entityName,
            userId: dto.user?.id,
            userName: dto.user?.fullName,
            userRole: dto.user?.role,
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
            oldValues: dto.oldValues,
            newValues: dto.newValues,
            changedFields: this.getChangedFields(dto.oldValues, dto.newValues),
            description: dto.description,
            metadata: dto.metadata,
        });
        return this.auditLogRepository.save(log);
    }
    getChangedFields(oldValues, newValues) {
        if (!oldValues || !newValues) {
            return undefined;
        }
        const changedFields = [];
        const allFields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
        for (const field of allFields) {
            if (JSON.stringify(oldValues[field]) !== JSON.stringify(newValues[field])) {
                changedFields.push(field);
            }
        }
        return changedFields.length > 0 ? changedFields : undefined;
    }
    async findByEntity(entityType, entityId) {
        return this.auditLogRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
    }
    async findByUser(userId, limit = 100) {
        return this.auditLogRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async findAll(page = 1, limit = 20, filters) {
        const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');
        if (filters?.entityType) {
            queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType: filters.entityType });
        }
        if (filters?.action) {
            queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
        }
        if (filters?.startDate) {
            queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
        }
        if (filters?.endDate) {
            queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
        }
        const [data, total] = await queryBuilder
            .orderBy('audit_log.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .leftJoinAndSelect('audit_log.user', 'user')
            .getManyAndCount();
        return { data, total, page, limit };
    }
    async getEntityHistory(entityType, entityId) {
        return this.auditLogRepository.find({
            where: { entityType, entityId },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map