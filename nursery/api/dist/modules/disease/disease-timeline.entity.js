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
exports.DiseaseTimeline = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const disease_entity_1 = require("./disease.entity");
let DiseaseTimeline = class DiseaseTimeline {
};
exports.DiseaseTimeline = DiseaseTimeline;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DiseaseTimeline.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => disease_entity_1.Disease, (disease) => disease.timelines),
    (0, typeorm_1.JoinColumn)({ name: 'disease_id' }),
    __metadata("design:type", disease_entity_1.Disease)
], DiseaseTimeline.prototype, "disease", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disease_id' }),
    __metadata("design:type", Number)
], DiseaseTimeline.prototype, "diseaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'operator_id' }),
    __metadata("design:type", user_entity_1.User)
], DiseaseTimeline.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operator_id' }),
    __metadata("design:type", Number)
], DiseaseTimeline.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action', length: 100 }),
    __metadata("design:type", String)
], DiseaseTimeline.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DiseaseTimeline.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], DiseaseTimeline.prototype, "operatedAt", void 0);
exports.DiseaseTimeline = DiseaseTimeline = __decorate([
    (0, typeorm_1.Entity)('disease_timelines')
], DiseaseTimeline);
//# sourceMappingURL=disease-timeline.entity.js.map