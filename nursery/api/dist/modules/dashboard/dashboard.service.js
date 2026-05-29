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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const disease_entity_1 = require("../disease/disease.entity");
const inspection_entity_1 = require("../inspection/inspection.entity");
const negotiation_entity_1 = require("../negotiation/negotiation.entity");
const plot_entity_1 = require("../plot/plot.entity");
const user_entity_1 = require("../user/user.entity");
let DashboardService = class DashboardService {
    constructor(plotRepository, inspectionRepository, diseaseRepository, negotiationRepository, userRepository) {
        this.plotRepository = plotRepository;
        this.inspectionRepository = inspectionRepository;
        this.diseaseRepository = diseaseRepository;
        this.negotiationRepository = negotiationRepository;
        this.userRepository = userRepository;
    }
    async getStats() {
        const [totalPlots, totalInspections, pendingInspections, totalDiseases, activeDiseases, overdueDiseases, totalNegotiations, pendingNegotiations,] = await Promise.all([
            this.plotRepository.count(),
            this.inspectionRepository.count(),
            this.inspectionRepository.count({ where: { status: inspection_entity_1.InspectionStatus.PENDING } }),
            this.diseaseRepository.count(),
            this.diseaseRepository.count({ where: { status: disease_entity_1.DiseaseStatus.REPORTED } }),
            this.diseaseRepository.count({ where: { isOverdue: true } }),
            this.negotiationRepository.count(),
            this.negotiationRepository.count({ where: { status: negotiation_entity_1.NegotiationStatus.IN_PROGRESS } }),
        ]);
        const diseaseBySeverity = {
            [disease_entity_1.DiseaseSeverity.MINOR]: await this.diseaseRepository.count({ where: { severity: disease_entity_1.DiseaseSeverity.MINOR } }),
            [disease_entity_1.DiseaseSeverity.MODERATE]: await this.diseaseRepository.count({ where: { severity: disease_entity_1.DiseaseSeverity.MODERATE } }),
            [disease_entity_1.DiseaseSeverity.MAJOR]: await this.diseaseRepository.count({ where: { severity: disease_entity_1.DiseaseSeverity.MAJOR } }),
        };
        const diseaseByStatus = {
            [disease_entity_1.DiseaseStatus.REPORTED]: await this.diseaseRepository.count({ where: { status: disease_entity_1.DiseaseStatus.REPORTED } }),
            [disease_entity_1.DiseaseStatus.CONFIRMED]: await this.diseaseRepository.count({ where: { status: disease_entity_1.DiseaseStatus.CONFIRMED } }),
            [disease_entity_1.DiseaseStatus.TREATING]: await this.diseaseRepository.count({ where: { status: disease_entity_1.DiseaseStatus.TREATING } }),
            [disease_entity_1.DiseaseStatus.RESOLVED]: await this.diseaseRepository.count({ where: { status: disease_entity_1.DiseaseStatus.RESOLVED } }),
        };
        const usersByRole = {
            [user_entity_1.UserRole.BASE_MANAGER]: await this.userRepository.count({ where: { role: user_entity_1.UserRole.BASE_MANAGER } }),
            [user_entity_1.UserRole.INSPECTOR]: await this.userRepository.count({ where: { role: user_entity_1.UserRole.INSPECTOR } }),
            [user_entity_1.UserRole.SALES]: await this.userRepository.count({ where: { role: user_entity_1.UserRole.SALES } }),
        };
        const recentInspections = await this.inspectionRepository.find({
            relations: ['plot'],
            order: { createdAt: 'DESC' },
            take: 3,
        });
        const recentDiseases = await this.diseaseRepository.find({
            relations: ['plot'],
            order: { reportedAt: 'DESC' },
            take: 3,
        });
        const recentNegotiations = await this.negotiationRepository.find({
            relations: ['disease', 'disease.plot'],
            order: { createdAt: 'DESC' },
            take: 3,
        });
        const recentActivities = [
            ...recentInspections.map(i => ({
                id: i.id,
                type: 'inspection',
                title: `${i.plot.name} 巡查`,
                status: i.status,
                time: i.createdAt,
            })),
            ...recentDiseases.map(d => ({
                id: d.id,
                type: 'disease',
                title: `${d.plot.name} ${d.type}`,
                status: d.status,
                time: d.reportedAt,
            })),
            ...recentNegotiations.map(n => ({
                id: n.id,
                type: 'negotiation',
                title: `${n.disease.plot.name} 补苗协商`,
                status: n.status,
                time: n.createdAt,
            })),
        ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
        return {
            totalPlots,
            totalInspections,
            pendingInspections,
            totalDiseases,
            activeDiseases,
            overdueDiseases,
            totalNegotiations,
            pendingNegotiations,
            diseaseBySeverity,
            diseaseByStatus,
            recentActivities,
            usersByRole,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plot_entity_1.Plot)),
    __param(1, (0, typeorm_1.InjectRepository)(inspection_entity_1.Inspection)),
    __param(2, (0, typeorm_1.InjectRepository)(disease_entity_1.Disease)),
    __param(3, (0, typeorm_1.InjectRepository)(negotiation_entity_1.Negotiation)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map