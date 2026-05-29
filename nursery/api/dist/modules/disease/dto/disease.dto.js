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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTimelineDto = exports.QueryDiseaseDto = exports.UpdateDiseaseStatusDto = exports.CreateDiseaseDto = void 0;
const class_validator_1 = require("class-validator");
const disease_entity_1 = require("../disease.entity");
class CreateDiseaseDto {
}
exports.CreateDiseaseDto = CreateDiseaseDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiseaseDto.prototype, "inspectionId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiseaseDto.prototype, "plotId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiseaseDto.prototype, "reporterId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDiseaseDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(disease_entity_1.DiseaseSeverity),
    __metadata("design:type", String)
], CreateDiseaseDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDiseaseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDiseaseDto.prototype, "affectedQuantity", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDiseaseDto.prototype, "reportedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(disease_entity_1.DiseaseStatus),
    __metadata("design:type", String)
], CreateDiseaseDto.prototype, "status", void 0);
class UpdateDiseaseStatusDto {
}
exports.UpdateDiseaseStatusDto = UpdateDiseaseStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(disease_entity_1.DiseaseStatus),
    __metadata("design:type", String)
], UpdateDiseaseStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDiseaseStatusDto.prototype, "operatorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDiseaseStatusDto.prototype, "remark", void 0);
class QueryDiseaseDto {
}
exports.QueryDiseaseDto = QueryDiseaseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryDiseaseDto.prototype, "plotId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(disease_entity_1.DiseaseStatus),
    __metadata("design:type", String)
], QueryDiseaseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(disease_entity_1.DiseaseSeverity),
    __metadata("design:type", String)
], QueryDiseaseDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryDiseaseDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryDiseaseDto.prototype, "reporterId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryDiseaseDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryDiseaseDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], QueryDiseaseDto.prototype, "isOverdue", void 0);
class CreateTimelineDto {
}
exports.CreateTimelineDto = CreateTimelineDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTimelineDto.prototype, "diseaseId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTimelineDto.prototype, "operatorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTimelineDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTimelineDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimelineDto.prototype, "operatedAt", void 0);
//# sourceMappingURL=disease.dto.js.map