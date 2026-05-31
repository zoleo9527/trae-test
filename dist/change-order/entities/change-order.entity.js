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
exports.ChangeOrder = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const change_order_status_enum_1 = require("../../common/enums/change-order-status.enum");
const user_entity_1 = require("../../user/entities/user.entity");
const change_order_version_entity_1 = require("./change-order-version.entity");
const sign_off_entity_1 = require("../../sign-off/entities/sign-off.entity");
const daily_report_entity_1 = require("../../daily-report/entities/daily-report.entity");
const delivery_entity_1 = require("../../delivery/entities/delivery.entity");
let ChangeOrder = class ChangeOrder extends base_entity_1.BaseEntity {
};
exports.ChangeOrder = ChangeOrder;
__decorate([
    (0, typeorm_1.Column)({ unique: true, name: 'order_number' }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "orderNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChangeOrder.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: change_order_status_enum_1.ChangeOrderType,
        name: 'change_type',
    }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "changeType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: change_order_status_enum_1.ChangeOrderStatus,
        default: change_order_status_enum_1.ChangeOrderStatus.DRAFT,
    }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rework_reason', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "reworkReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'material_tracking', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "materialTracking", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'original_amount', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "originalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'changed_amount', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "changedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'labor_cost', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "laborCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'material_cost', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "materialCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'equipment_cost', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "equipmentCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'other_cost', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "otherCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'estimated_days', nullable: true }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "estimatedDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'proposed_date', nullable: true }),
    __metadata("design:type", Date)
], ChangeOrder.prototype, "proposedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_date', nullable: true }),
    __metadata("design:type", Date)
], ChangeOrder.prototype, "approvedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'completed_date', nullable: true }),
    __metadata("design:type", Date)
], ChangeOrder.prototype, "completedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'settled_date', nullable: true }),
    __metadata("design:type", Date)
], ChangeOrder.prototype, "settledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'reject_reason', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_name' }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "projectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'construction_site', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "constructionSite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_name', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "teamName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdChangeOrders),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], ChangeOrder.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by_id', nullable: true }),
    __metadata("design:type", String)
], ChangeOrder.prototype, "approvedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'approved_by_id' }),
    __metadata("design:type", user_entity_1.User)
], ChangeOrder.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_version', default: 1 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "currentVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sign_off_process_version', default: 1 }),
    __metadata("design:type", Number)
], ChangeOrder.prototype, "signOffProcessVersion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => change_order_version_entity_1.ChangeOrderVersion, (version) => version.changeOrder),
    __metadata("design:type", Array)
], ChangeOrder.prototype, "versions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sign_off_entity_1.SignOff, (signOff) => signOff.changeOrder),
    __metadata("design:type", Array)
], ChangeOrder.prototype, "signOffs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => daily_report_entity_1.DailyReport, (report) => report.changeOrder),
    __metadata("design:type", Array)
], ChangeOrder.prototype, "dailyReports", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_entity_1.Delivery, (delivery) => delivery.changeOrder),
    __metadata("design:type", Array)
], ChangeOrder.prototype, "deliveries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ChangeOrder.prototype, "metadata", void 0);
exports.ChangeOrder = ChangeOrder = __decorate([
    (0, typeorm_1.Entity)('change_orders')
], ChangeOrder);
//# sourceMappingURL=change-order.entity.js.map