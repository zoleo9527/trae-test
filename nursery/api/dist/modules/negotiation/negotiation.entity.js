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
exports.Negotiation = exports.NegotiationStatus = void 0;
const typeorm_1 = require("typeorm");
const disease_entity_1 = require("../disease/disease.entity");
const user_entity_1 = require("../user/user.entity");
var NegotiationStatus;
(function (NegotiationStatus) {
    NegotiationStatus["PENDING"] = "pending";
    NegotiationStatus["IN_PROGRESS"] = "in_progress";
    NegotiationStatus["CONFIRMED"] = "confirmed";
    NegotiationStatus["CLOSED"] = "closed";
})(NegotiationStatus || (exports.NegotiationStatus = NegotiationStatus = {}));
let Negotiation = class Negotiation {
};
exports.Negotiation = Negotiation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Negotiation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => disease_entity_1.Disease, (disease) => disease.negotiations),
    (0, typeorm_1.JoinColumn)({ name: 'disease_id' }),
    __metadata("design:type", disease_entity_1.Disease)
], Negotiation.prototype, "disease", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disease_id' }),
    __metadata("design:type", Number)
], Negotiation.prototype, "diseaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'initiator_id' }),
    __metadata("design:type", user_entity_1.User)
], Negotiation.prototype, "initiator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'initiator_id' }),
    __metadata("design:type", Number)
], Negotiation.prototype, "initiatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'confirmed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Negotiation.prototype, "confirmedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_by_id', nullable: true }),
    __metadata("design:type", Number)
], Negotiation.prototype, "confirmedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sales_opinion', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Negotiation.prototype, "salesOpinion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'base_opinion', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Negotiation.prototype, "baseOpinion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'replant_quantity', nullable: true }),
    __metadata("design:type", Number)
], Negotiation.prototype, "replantQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'replant_variety', length: 100, nullable: true }),
    __metadata("design:type", String)
], Negotiation.prototype, "replantVariety", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'replant_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], Negotiation.prototype, "replantDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'enum', enum: NegotiationStatus, default: NegotiationStatus.PENDING }),
    __metadata("design:type", String)
], Negotiation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Negotiation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Negotiation.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Negotiation.prototype, "updatedAt", void 0);
exports.Negotiation = Negotiation = __decorate([
    (0, typeorm_1.Entity)('negotiations')
], Negotiation);
//# sourceMappingURL=negotiation.entity.js.map