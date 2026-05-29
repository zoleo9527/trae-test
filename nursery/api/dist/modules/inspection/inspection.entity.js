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
exports.Inspection = exports.InspectionStatus = void 0;
const typeorm_1 = require("typeorm");
const disease_entity_1 = require("../disease/disease.entity");
const plot_entity_1 = require("../plot/plot.entity");
const user_entity_1 = require("../user/user.entity");
var InspectionStatus;
(function (InspectionStatus) {
    InspectionStatus["PENDING"] = "pending";
    InspectionStatus["COMPLETED"] = "completed";
})(InspectionStatus || (exports.InspectionStatus = InspectionStatus = {}));
let Inspection = class Inspection {
};
exports.Inspection = Inspection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Inspection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plot_entity_1.Plot),
    (0, typeorm_1.JoinColumn)({ name: 'plot_id' }),
    __metadata("design:type", plot_entity_1.Plot)
], Inspection.prototype, "plot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plot_id' }),
    __metadata("design:type", Number)
], Inspection.prototype, "plotId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'inspector_id' }),
    __metadata("design:type", user_entity_1.User)
], Inspection.prototype, "inspector", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inspector_id' }),
    __metadata("design:type", Number)
], Inspection.prototype, "inspectorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'growth_status', length: 50, nullable: true }),
    __metadata("design:type", String)
], Inspection.prototype, "growthStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'soil_condition', length: 50, nullable: true }),
    __metadata("design:type", String)
], Inspection.prototype, "soilCondition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'moisture_condition', length: 50, nullable: true }),
    __metadata("design:type", String)
], Inspection.prototype, "moistureCondition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remark', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Inspection.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'enum', enum: InspectionStatus, default: InspectionStatus.PENDING }),
    __metadata("design:type", String)
], Inspection.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inspection_date', type: 'date' }),
    __metadata("design:type", String)
], Inspection.prototype, "inspectionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'has_disease', default: false }),
    __metadata("design:type", Boolean)
], Inspection.prototype, "hasDisease", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => disease_entity_1.Disease, (disease) => disease.inspection),
    __metadata("design:type", disease_entity_1.Disease)
], Inspection.prototype, "disease", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Inspection.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Inspection.prototype, "updatedAt", void 0);
exports.Inspection = Inspection = __decorate([
    (0, typeorm_1.Entity)('inspections')
], Inspection);
//# sourceMappingURL=inspection.entity.js.map