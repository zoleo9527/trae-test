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
exports.CommentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
const audit_service_1 = require("../audit/audit.service");
let CommentService = class CommentService {
    constructor(commentRepository, auditService) {
        this.commentRepository = commentRepository;
        this.auditService = auditService;
    }
    async create(data, authorId, authorName) {
        const comment = this.commentRepository.create({
            ...data,
            authorId,
            isPrivate: data.isPrivate || false,
        });
        const saved = await this.commentRepository.save(comment);
        const entityType = this.getEntityType(data);
        const entityId = this.getEntityId(data);
        if (entityType && entityId) {
            await this.auditService.log(entityType, entityId, 'ADD_COMMENT', null, { commentId: saved.id }, authorId, authorName, '添加备注');
        }
        return this.commentRepository.findOne({
            where: { id: saved.id },
            relations: ['author'],
        });
    }
    async findByEntity(filters) {
        const where = {};
        if (filters.workOrderId)
            where.workOrderId = filters.workOrderId;
        if (filters.refundId)
            where.refundId = filters.refundId;
        if (filters.transferId)
            where.transferId = filters.transferId;
        if (filters.materialId)
            where.materialId = filters.materialId;
        return this.commentRepository.find({
            where,
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }
    getEntityType(data) {
        if (data.workOrderId)
            return 'WorkOrder';
        if (data.refundId)
            return 'Refund';
        if (data.transferId)
            return 'Transfer';
        if (data.materialId)
            return 'Material';
        return null;
    }
    getEntityId(data) {
        if (data.workOrderId)
            return data.workOrderId;
        if (data.refundId)
            return data.refundId;
        if (data.transferId)
            return data.transferId;
        if (data.materialId)
            return data.materialId;
        return null;
    }
};
exports.CommentService = CommentService;
exports.CommentService = CommentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], CommentService);
//# sourceMappingURL=comment.service.js.map