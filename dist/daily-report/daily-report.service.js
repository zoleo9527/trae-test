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
exports.DailyReportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const daily_report_entity_1 = require("./entities/daily-report.entity");
const audit_enum_1 = require("../common/enums/audit.enum");
const audit_service_1 = require("../audit/audit.service");
let DailyReportService = class DailyReportService {
    constructor(dailyReportRepository, auditService) {
        this.dailyReportRepository = dailyReportRepository;
        this.auditService = auditService;
    }
    async create(createDto, user) {
        const report = this.dailyReportRepository.create({
            ...createDto,
            createdById: user.id,
            createdBy: user,
        });
        const saved = await this.dailyReportRepository.save(report);
        await this.auditService.createLog({
            action: audit_enum_1.AuditAction.CREATE,
            entityType: audit_enum_1.AuditEntityType.DAILY_REPORT,
            entityId: saved.id,
            entityName: `日报-${saved.reportDate}`,
            user,
            newValues: saved,
            description: '创建施工日报',
        });
        return this.findOne(saved.id);
    }
    async findAll(page = 1, limit = 20, filters) {
        const queryBuilder = this.dailyReportRepository.createQueryBuilder('dr')
            .leftJoinAndSelect('dr.createdBy', 'createdBy')
            .leftJoinAndSelect('dr.changeOrder', 'changeOrder');
        if (filters?.projectId) {
            queryBuilder.andWhere('dr.projectId = :projectId', { projectId: filters.projectId });
        }
        if (filters?.startDate) {
            queryBuilder.andWhere('dr.reportDate >= :startDate', { startDate: filters.startDate });
        }
        if (filters?.endDate) {
            queryBuilder.andWhere('dr.reportDate <= :endDate', { endDate: filters.endDate });
        }
        const [data, total] = await queryBuilder
            .orderBy('dr.reportDate', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const report = await this.dailyReportRepository.findOne({
            where: { id },
            relations: ['createdBy', 'changeOrder', 'signOffs'],
        });
        if (!report) {
            throw new common_1.NotFoundException('施工日报不存在');
        }
        return report;
    }
    async update(id, updateDto, user) {
        const report = await this.findOne(id);
        const oldValues = { ...report };
        Object.assign(report, updateDto);
        const saved = await this.dailyReportRepository.save(report);
        await this.auditService.createLog({
            action: audit_enum_1.AuditAction.UPDATE,
            entityType: audit_enum_1.AuditEntityType.DAILY_REPORT,
            entityId: id,
            entityName: `日报-${saved.reportDate}`,
            user,
            oldValues,
            newValues: saved,
            description: '更新施工日报',
        });
        return this.findOne(id);
    }
    async findByChangeOrder(changeOrderId) {
        return this.dailyReportRepository.find({
            where: { changeOrderId },
            relations: ['createdBy'],
            order: { reportDate: 'DESC' },
        });
    }
};
exports.DailyReportService = DailyReportService;
exports.DailyReportService = DailyReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(daily_report_entity_1.DailyReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], DailyReportService);
//# sourceMappingURL=daily-report.service.js.map