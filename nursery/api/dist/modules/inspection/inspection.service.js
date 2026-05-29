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
exports.InspectionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inspection_entity_1 = require("./inspection.entity");
let InspectionService = class InspectionService {
    constructor(inspectionRepository) {
        this.inspectionRepository = inspectionRepository;
    }
    async findAll(query) {
        const qb = this.inspectionRepository.createQueryBuilder('inspection')
            .leftJoinAndSelect('inspection.plot', 'plot')
            .leftJoinAndSelect('inspection.inspector', 'inspector')
            .leftJoinAndSelect('inspection.disease', 'disease');
        if (query?.plotId) {
            qb.andWhere('inspection.plotId = :plotId', { plotId: query.plotId });
        }
        if (query?.inspectorId) {
            qb.andWhere('inspection.inspectorId = :inspectorId', { inspectorId: query.inspectorId });
        }
        if (query?.status) {
            qb.andWhere('inspection.status = :status', { status: query.status });
        }
        if (query?.hasDisease !== undefined) {
            qb.andWhere('inspection.hasDisease = :hasDisease', { hasDisease: query.hasDisease });
        }
        if (query?.startDate) {
            qb.andWhere('inspection.inspectionDate >= :startDate', { startDate: query.startDate });
        }
        if (query?.endDate) {
            qb.andWhere('inspection.inspectionDate <= :endDate', { endDate: query.endDate });
        }
        qb.orderBy('inspection.inspectionDate', 'DESC');
        return qb.getMany();
    }
    async findOne(id) {
        return this.inspectionRepository.findOne({
            where: { id },
            relations: ['plot', 'inspector', 'disease'],
        });
    }
    async create(dto) {
        const inspection = this.inspectionRepository.create({
            ...dto,
            status: dto.status ?? inspection_entity_1.InspectionStatus.PENDING,
            hasDisease: dto.hasDisease ?? false,
        });
        return this.inspectionRepository.save(inspection);
    }
    async complete(id, dto) {
        await this.inspectionRepository.update(id, {
            ...dto,
            status: inspection_entity_1.InspectionStatus.COMPLETED,
        });
        return this.findOne(id);
    }
};
exports.InspectionService = InspectionService;
exports.InspectionService = InspectionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inspection_entity_1.Inspection)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InspectionService);
//# sourceMappingURL=inspection.service.js.map