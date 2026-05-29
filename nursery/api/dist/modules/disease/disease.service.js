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
exports.DiseaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inspection_entity_1 = require("../inspection/inspection.entity");
const disease_timeline_entity_1 = require("./disease-timeline.entity");
const disease_entity_1 = require("./disease.entity");
let DiseaseService = class DiseaseService {
    constructor(diseaseRepository, timelineRepository, inspectionRepository) {
        this.diseaseRepository = diseaseRepository;
        this.timelineRepository = timelineRepository;
        this.inspectionRepository = inspectionRepository;
    }
    async findAll(query) {
        const qb = this.diseaseRepository.createQueryBuilder('disease')
            .leftJoinAndSelect('disease.plot', 'plot')
            .leftJoinAndSelect('disease.reporter', 'reporter')
            .leftJoinAndSelect('disease.inspection', 'inspection')
            .leftJoinAndSelect('disease.timelines', 'timelines')
            .leftJoinAndSelect('timelines.operator', 'operator');
        if (query?.plotId) {
            qb.andWhere('disease.plotId = :plotId', { plotId: query.plotId });
        }
        if (query?.status) {
            qb.andWhere('disease.status = :status', { status: query.status });
        }
        if (query?.severity) {
            qb.andWhere('disease.severity = :severity', { severity: query.severity });
        }
        if (query?.type) {
            qb.andWhere('disease.type LIKE :type', { type: `%${query.type}%` });
        }
        if (query?.reporterId) {
            qb.andWhere('disease.reporterId = :reporterId', { reporterId: query.reporterId });
        }
        if (query?.startDate) {
            qb.andWhere('disease.reportedAt >= :startDate', { startDate: query.startDate });
        }
        if (query?.endDate) {
            qb.andWhere('disease.reportedAt <= :endDate', { endDate: query.endDate });
        }
        if (query?.isOverdue !== undefined) {
            qb.andWhere('disease.isOverdue = :isOverdue', { isOverdue: query.isOverdue });
        }
        qb.orderBy('disease.reportedAt', 'DESC');
        qb.addOrderBy('timelines.operatedAt', 'ASC');
        return qb.getMany();
    }
    async findOne(id) {
        return this.diseaseRepository.findOne({
            where: { id },
            relations: ['plot', 'reporter', 'inspection', 'timelines', 'timelines.operator', 'negotiations'],
        });
    }
    async create(dto) {
        const disease = this.diseaseRepository.create({
            ...dto,
            status: dto.status ?? disease_entity_1.DiseaseStatus.REPORTED,
            reportedAt: new Date(dto.reportedAt),
        });
        const saved = await this.diseaseRepository.save(disease);
        if (dto.inspectionId) {
            await this.inspectionRepository.update(dto.inspectionId, {
                hasDisease: true,
            });
        }
        await this.addTimeline({
            diseaseId: saved.id,
            operatorId: dto.reporterId,
            action: '上报病害',
            content: dto.description || `${dto.type}，${this.getSeverityText(dto.severity)}`,
            operatedAt: dto.reportedAt,
        });
        await this.checkOverdue(saved.id);
        return this.findOne(saved.id);
    }
    async updateStatus(id, dto) {
        const disease = await this.findOne(id);
        if (!disease) {
            throw new common_1.BadRequestException('病害记录不存在');
        }
        const updateData = { status: dto.status };
        const now = new Date();
        switch (dto.status) {
            case disease_entity_1.DiseaseStatus.CONFIRMED:
                updateData.confirmedAt = now;
                break;
            case disease_entity_1.DiseaseStatus.RESOLVED:
                updateData.resolvedAt = now;
                break;
        }
        await this.diseaseRepository.update(id, updateData);
        await this.addTimeline({
            diseaseId: id,
            operatorId: dto.operatorId,
            action: this.getStatusActionText(dto.status),
            content: dto.remark || '',
            operatedAt: now.toISOString(),
        });
        return this.findOne(id);
    }
    async addTimeline(dto) {
        const timeline = this.timelineRepository.create({
            ...dto,
            operatedAt: new Date(dto.operatedAt),
        });
        return this.timelineRepository.save(timeline);
    }
    async checkOverdue(id) {
        const disease = await this.findOne(id);
        if (!disease)
            return;
        const now = new Date();
        const reportedAt = new Date(disease.reportedAt);
        const diffDays = Math.floor((now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60 * 24));
        const overdueThreshold = disease.severity === disease_entity_1.DiseaseSeverity.MAJOR ? 1 : 3;
        if (diffDays > overdueThreshold && disease.status === disease_entity_1.DiseaseStatus.REPORTED) {
            await this.diseaseRepository.update(id, { isOverdue: true });
        }
    }
    async updateOverdueStatus() {
        const diseases = await this.diseaseRepository.find({
            where: { status: disease_entity_1.DiseaseStatus.REPORTED, isOverdue: false },
        });
        for (const disease of diseases) {
            await this.checkOverdue(disease.id);
        }
    }
    getSeverityText(severity) {
        const map = {
            [disease_entity_1.DiseaseSeverity.MINOR]: '轻度',
            [disease_entity_1.DiseaseSeverity.MODERATE]: '中度',
            [disease_entity_1.DiseaseSeverity.MAJOR]: '重度',
        };
        return map[severity];
    }
    getStatusActionText(status) {
        const map = {
            [disease_entity_1.DiseaseStatus.REPORTED]: '上报病害',
            [disease_entity_1.DiseaseStatus.CONFIRMED]: '确认病害',
            [disease_entity_1.DiseaseStatus.TREATING]: '开始处理',
            [disease_entity_1.DiseaseStatus.RESOLVED]: '处理完成',
        };
        return map[status];
    }
};
exports.DiseaseService = DiseaseService;
exports.DiseaseService = DiseaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(disease_entity_1.Disease)),
    __param(1, (0, typeorm_1.InjectRepository)(disease_timeline_entity_1.DiseaseTimeline)),
    __param(2, (0, typeorm_1.InjectRepository)(inspection_entity_1.Inspection)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DiseaseService);
//# sourceMappingURL=disease.service.js.map