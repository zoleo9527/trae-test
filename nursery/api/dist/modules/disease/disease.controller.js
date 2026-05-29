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
exports.DiseaseController = void 0;
const common_1 = require("@nestjs/common");
const disease_service_1 = require("./disease.service");
const disease_dto_1 = require("./dto/disease.dto");
let DiseaseController = class DiseaseController {
    constructor(diseaseService) {
        this.diseaseService = diseaseService;
    }
    async findAll(query) {
        return this.diseaseService.findAll(query);
    }
    async findOne(id) {
        return this.diseaseService.findOne(id);
    }
    async create(dto) {
        return this.diseaseService.create(dto);
    }
    async updateStatus(id, dto) {
        return this.diseaseService.updateStatus(id, dto);
    }
};
exports.DiseaseController = DiseaseController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [disease_dto_1.QueryDiseaseDto]),
    __metadata("design:returntype", Promise)
], DiseaseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DiseaseController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [disease_dto_1.CreateDiseaseDto]),
    __metadata("design:returntype", Promise)
], DiseaseController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, disease_dto_1.UpdateDiseaseStatusDto]),
    __metadata("design:returntype", Promise)
], DiseaseController.prototype, "updateStatus", null);
exports.DiseaseController = DiseaseController = __decorate([
    (0, common_1.Controller)('api/diseases'),
    __metadata("design:paramtypes", [disease_service_1.DiseaseService])
], DiseaseController);
//# sourceMappingURL=disease.controller.js.map