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
exports.SignOff = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const sign_off_enum_1 = require("../../common/enums/sign-off.enum");
const user_entity_1 = require("../../user/entities/user.entity");
const change_order_entity_1 = require("../../change-order/entities/change-order.entity");
const daily_report_entity_1 = require("../../daily-report/entities/daily-report.entity");
const delivery_entity_1 = require("../../delivery/entities/delivery.entity");
let SignOff = class SignOff extends base_entity_1.BaseEntity {
};
exports.SignOff = SignOff;
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: sign_off_enum_1.SignOffType,
        name: 'sign_off_type',
    }),
    __metadata("design:type", String)
], SignOff.prototype, "signOffType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: sign_off_enum_1.SignOffStatus,
        default: sign_off_enum_1.SignOffStatus.PENDING,
    }),
    __metadata("design:type", String)
], SignOff.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sequence_order', default: 1 }),
    __metadata("design:type", Number)
], SignOff.prototype, "sequenceOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'change_order_id', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "changeOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => change_order_entity_1.ChangeOrder, (changeOrder) => changeOrder.signOffs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'change_order_id' }),
    __metadata("design:type", change_order_entity_1.ChangeOrder)
], SignOff.prototype, "changeOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'daily_report_id', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "dailyReportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => daily_report_entity_1.DailyReport, (report) => report.signOffs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'daily_report_id' }),
    __metadata("design:type", daily_report_entity_1.DailyReport)
], SignOff.prototype, "dailyReport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_id', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "deliveryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_entity_1.Delivery, (delivery) => delivery.signOffs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_id' }),
    __metadata("design:type", delivery_entity_1.Delivery)
], SignOff.prototype, "delivery", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requested_by_id' }),
    __metadata("design:type", String)
], SignOff.prototype, "requestedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.requestedSignOffs),
    (0, typeorm_1.JoinColumn)({ name: 'requested_by_id' }),
    __metadata("design:type", user_entity_1.User)
], SignOff.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'signed_by_id', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "signedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.signedSignOffs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'signed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], SignOff.prototype, "signedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'signed_at', nullable: true }),
    __metadata("design:type", Date)
], SignOff.prototype, "signedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'deadline', nullable: true }),
    __metadata("design:type", Date)
], SignOff.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'comments', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'reject_reason', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'signer_role', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "signerRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'signer_department', nullable: true }),
    __metadata("design:type", String)
], SignOff.prototype, "signerDepartment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'process_version', default: 1 }),
    __metadata("design:type", Number)
], SignOff.prototype, "processVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SignOff.prototype, "metadata", void 0);
exports.SignOff = SignOff = __decorate([
    (0, typeorm_1.Entity)('sign_offs')
], SignOff);
//# sourceMappingURL=sign-off.entity.js.map