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
exports.NegotiationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const disease_service_1 = require("../disease/disease.service");
const negotiation_entity_1 = require("./negotiation.entity");
let NegotiationService = class NegotiationService {
    constructor(negotiationRepository, diseaseService) {
        this.negotiationRepository = negotiationRepository;
        this.diseaseService = diseaseService;
    }
    async findAll(query) {
        const qb = this.negotiationRepository.createQueryBuilder('negotiation')
            .leftJoinAndSelect('negotiation.disease', 'disease')
            .leftJoinAndSelect('disease.plot', 'plot')
            .leftJoinAndSelect('negotiation.initiator', 'initiator')
            .leftJoinAndSelect('negotiation.confirmedBy', 'confirmedBy');
        if (query?.diseaseId) {
            qb.andWhere('negotiation.diseaseId = :diseaseId', { diseaseId: query.diseaseId });
        }
        if (query?.status) {
            qb.andWhere('negotiation.status = :status', { status: query.status });
        }
        if (query?.initiatorId) {
            qb.andWhere('negotiation.initiatorId = :initiatorId', { initiatorId: query.initiatorId });
        }
        if (query?.startDate) {
            qb.andWhere('negotiation.createdAt >= :startDate', { startDate: query.startDate });
        }
        if (query?.endDate) {
            qb.andWhere('negotiation.createdAt <= :endDate', { endDate: query.endDate });
        }
        qb.orderBy('negotiation.createdAt', 'DESC');
        return qb.getMany();
    }
    async findOne(id) {
        return this.negotiationRepository.findOne({
            where: { id },
            relations: ['disease', 'disease.plot', 'initiator', 'confirmedBy'],
        });
    }
    async create(dto) {
        const disease = await this.diseaseService.findOne(dto.diseaseId);
        if (!disease) {
            throw new common_1.BadRequestException('关联的病害记录不存在');
        }
        const negotiation = this.negotiationRepository.create({
            ...dto,
            status: dto.status ?? negotiation_entity_1.NegotiationStatus.IN_PROGRESS,
        });
        const saved = await this.negotiationRepository.save(negotiation);
        await this.diseaseService.addTimeline({
            diseaseId: dto.diseaseId,
            operatorId: dto.initiatorId,
            action: '启动协商',
            content: dto.salesOpinion || '销售发起补苗协商',
            operatedAt: new Date().toISOString(),
        });
        return this.findOne(saved.id);
    }
    async updateStatus(id, dto) {
        const negotiation = await this.findOne(id);
        if (!negotiation) {
            throw new common_1.BadRequestException('协商记录不存在');
        }
        const updateData = {
            status: dto.status,
        };
        if (dto.salesOpinion !== undefined)
            updateData.salesOpinion = dto.salesOpinion;
        if (dto.baseOpinion !== undefined)
            updateData.baseOpinion = dto.baseOpinion;
        if (dto.replantQuantity !== undefined)
            updateData.replantQuantity = dto.replantQuantity;
        if (dto.replantVariety !== undefined)
            updateData.replantVariety = dto.replantVariety;
        if (dto.replantDate !== undefined)
            updateData.replantDate = dto.replantDate;
        if (dto.status === negotiation_entity_1.NegotiationStatus.CONFIRMED || dto.status === negotiation_entity_1.NegotiationStatus.CLOSED) {
            updateData.confirmedById = dto.operatorId;
            updateData.confirmedAt = new Date();
        }
        await this.negotiationRepository.update(id, updateData);
        const actionText = this.getStatusActionText(dto.status);
        const content = [
            dto.baseOpinion,
            dto.replantQuantity ? `补植${dto.replantQuantity}株` : '',
            dto.replantVariety ? `品种：${dto.replantVariety}` : '',
            dto.replantDate ? `日期：${dto.replantDate}` : '',
        ].filter(Boolean).join('，');
        await this.diseaseService.addTimeline({
            diseaseId: negotiation.diseaseId,
            operatorId: dto.operatorId,
            action: `协商${actionText}`,
            content,
            operatedAt: new Date().toISOString(),
        });
        return this.findOne(id);
    }
    getStatusActionText(status) {
        const map = {
            [negotiation_entity_1.NegotiationStatus.PENDING]: '待处理',
            [negotiation_entity_1.NegotiationStatus.IN_PROGRESS]: '处理中',
            [negotiation_entity_1.NegotiationStatus.CONFIRMED]: '已确认',
            [negotiation_entity_1.NegotiationStatus.CLOSED]: '已关闭',
        };
        return map[status];
    }
};
exports.NegotiationService = NegotiationService;
exports.NegotiationService = NegotiationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(negotiation_entity_1.Negotiation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        disease_service_1.DiseaseService])
], NegotiationService);
//# sourceMappingURL=negotiation.service.js.map