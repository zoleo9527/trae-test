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
exports.Disease = exports.DiseaseStatus = exports.DiseaseSeverity = void 0;
const typeorm_1 = require("typeorm");
const inspection_entity_1 = require("../inspection/inspection.entity");
const negotiation_entity_1 = require("../negotiation/negotiation.entity");
const plot_entity_1 = require("../plot/plot.entity");
const user_entity_1 = require("../user/user.entity");
const disease_timeline_entity_1 = require("./disease-timeline.entity");
var DiseaseSeverity;
(function (DiseaseSeverity) {
    DiseaseSeverity["MINOR"] = "minor";
    DiseaseSeverity["MODERATE"] = "moderate";
    DiseaseSeverity["MAJOR"] = "major";
})(DiseaseSeverity || (exports.DiseaseSeverity = DiseaseSeverity = {}));
var DiseaseStatus;
(function (DiseaseStatus) {
    DiseaseStatus["REPORTED"] = "reported";
    DiseaseStatus["CONFIRMED"] = "confirmed";
    DiseaseStatus["TREATING"] = "treating";
    DiseaseStatus["RESOLVED"] = "resolved";
})(DiseaseStatus || (exports.DiseaseStatus = DiseaseStatus = {}));
let Disease = class Disease {
};
exports.Disease = Disease;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Disease.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => inspection_entity_1.Inspection, (inspection) => inspection.disease),
    (0, typeorm_1.JoinColumn)({ name: 'inspection_id' }),
    __metadata("design:type", inspection_entity_1.Inspection)
], Disease.prototype, "inspection", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inspection_id' }),
    __metadata("design:type", Number)
], Disease.prototype, "inspectionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plot_entity_1.Plot),
    (0, typeorm_1.JoinColumn)({ name: 'plot_id' }),
    __metadata("design:type", plot_entity_1.Plot)
], Disease.prototype, "plot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plot_id' }),
    __metadata("design:type", Number)
], Disease.prototype, "plotId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'reporter_id' }),
    __metadata("design:type", user_entity_1.User)
], Disease.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reporter_id' }),
    __metadata("design:type", Number)
], Disease.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'type', length: 100 }),
    __metadata("design:type", String)
], Disease.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'severity', type: 'enum', enum: DiseaseSeverity }),
    __metadata("design:type", String)
], Disease.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Disease.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'affected_quantity', nullable: true }),
    __metadata("design:type", Number)
], Disease.prototype, "affectedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'enum', enum: DiseaseStatus, default: DiseaseStatus.REPORTED }),
    __metadata("design:type", String)
], Disease.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reported_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Disease.prototype, "reportedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Disease.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Disease.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_overdue', default: false }),
    __metadata("design:type", Boolean)
], Disease.prototype, "isOverdue", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => disease_timeline_entity_1.DiseaseTimeline, (timeline) => timeline.disease, { eager: true }),
    __metadata("design:type", Array)
], Disease.prototype, "timelines", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => negotiation_entity_1.Negotiation, (negotiation) => negotiation.disease),
    __metadata("design:type", Array)
], Disease.prototype, "negotiations", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Disease.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Disease.prototype, "updatedAt", void 0);
exports.Disease = Disease = __decorate([
    (0, typeorm_1.Entity)('diseases')
], Disease);
//# sourceMappingURL=disease.entity.js.map