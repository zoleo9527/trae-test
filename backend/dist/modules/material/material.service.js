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
exports.MaterialService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const material_entity_1 = require("./material.entity");
const material_version_entity_1 = require("./material-version.entity");
const material_status_enum_1 = require("../../common/enums/material-status.enum");
const material_state_machine_1 = require("../../common/state-machines/material.state-machine");
const business_error_1 = require("../../common/errors/business-error");
const audit_service_1 = require("../audit/audit.service");
let MaterialService = class MaterialService {
    constructor(materialRepository, materialVersionRepository, auditService) {
        this.materialRepository = materialRepository;
        this.materialVersionRepository = materialVersionRepository;
        this.auditService = auditService;
    }
    async create(data, operatorId, operatorName) {
        const material = this.materialRepository.create({
            ...data,
            status: material_status_enum_1.MaterialStatus.DRAFT,
            currentVersion: 1,
            createdBy: operatorId,
            updatedBy: operatorId,
        });
        const saved = await this.materialRepository.save(material);
        if (data.fileUrl) {
            await this.createVersion(saved.id, 1, data.fileUrl, '初始版本', operatorId);
        }
        await this.auditService.log('Material', saved.id, 'CREATE', null, saved, operatorId, operatorName, '创建材料');
        return this.findOne(saved.id);
    }
    async findAll(page = 1, limit = 20, filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.workOrderId)
            where.workOrderId = filters.workOrderId;
        if (filters?.ownerId)
            where.ownerId = filters.ownerId;
        if (filters?.type)
            where.type = filters.type;
        const [data, total] = await this.materialRepository.findAndCount({
            where,
            relations: ['owner', 'versions', 'versions.uploader'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }
    async findOne(id) {
        const material = await this.materialRepository.findOne({
            where: { id },
            relations: [
                'workOrder',
                'workOrder.student',
                'owner',
                'versions',
                'versions.uploader',
                'comments',
                'comments.author',
            ],
        });
        if (!material) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.MATERIAL_NOT_FOUND, `材料 ${id} 不存在`);
        }
        return material;
    }
    async updateStatus(id, newStatus, operatorId, operatorName) {
        const material = await this.findOne(id);
        const oldStatus = material.status;
        material_state_machine_1.MaterialStateMachine.transition(oldStatus, newStatus);
        const oldValue = { ...material };
        material.status = newStatus;
        material.updatedBy = operatorId;
        const saved = await this.materialRepository.save(material);
        await this.auditService.log('Material', id, 'STATUS_CHANGE', { status: oldStatus }, { status: newStatus }, operatorId, operatorName, `材料状态从 ${oldStatus} 变更为 ${newStatus}`);
        return this.findOne(id);
    }
    async uploadNewVersion(id, fileUrl, changeLog, operatorId, operatorName) {
        const material = await this.findOne(id);
        const newVersion = material.currentVersion + 1;
        await this.createVersion(id, newVersion, fileUrl, changeLog, operatorId);
        material.currentVersion = newVersion;
        material.fileUrl = fileUrl;
        material.updatedBy = operatorId;
        material.status = material_status_enum_1.MaterialStatus.SUBMITTED;
        const saved = await this.materialRepository.save(material);
        await this.auditService.log('Material', id, 'NEW_VERSION', { version: material.currentVersion - 1 }, { version: newVersion }, operatorId, operatorName, `上传新版本 v${newVersion}`);
        return this.findOne(id);
    }
    async createVersion(materialId, version, fileUrl, changeLog, uploadedBy) {
        const materialVersion = this.materialVersionRepository.create({
            materialId,
            version,
            fileUrl,
            changeLog,
            uploadedBy,
        });
        return this.materialVersionRepository.save(materialVersion);
    }
    async getVersions(materialId) {
        return this.materialVersionRepository.find({
            where: { materialId },
            relations: ['uploader'],
            order: { version: 'DESC' },
        });
    }
    async checkDeadlines() {
        const today = new Date();
        const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        return this.materialRepository
            .createQueryBuilder('material')
            .where('material.deadline <= :threeDaysLater', { threeDaysLater })
            .andWhere('material.deadline >= :today', { today })
            .andWhere('material.status NOT IN (:...completedStatuses)', {
            completedStatuses: [material_status_enum_1.MaterialStatus.APPROVED, material_status_enum_1.MaterialStatus.EXPIRED],
        })
            .getMany();
    }
};
exports.MaterialService = MaterialService;
exports.MaterialService = MaterialService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __param(1, (0, typeorm_1.InjectRepository)(material_version_entity_1.MaterialVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], MaterialService);
//# sourceMappingURL=material.service.js.map