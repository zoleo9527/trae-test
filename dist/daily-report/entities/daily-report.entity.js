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
exports.DailyReport = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../user/entities/user.entity");
const change_order_entity_1 = require("../../change-order/entities/change-order.entity");
const sign_off_entity_1 = require("../../sign-off/entities/sign-off.entity");
let DailyReport = class DailyReport extends base_entity_1.BaseEntity {
};
exports.DailyReport = DailyReport;
__decorate([
    (0, typeorm_1.Column)({ name: 'report_date', type: 'date' }),
    __metadata("design:type", String)
], DailyReport.prototype, "reportDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], DailyReport.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_name' }),
    __metadata("design:type", String)
], DailyReport.prototype, "projectName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'construction_site', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "constructionSite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_name', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "teamName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'worker_count', default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "workerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'work_hours', precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "workHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'work_content' }),
    __metadata("design:type", String)
], DailyReport.prototype, "workContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'progress_status', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "progressStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'quality_issues', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "qualityIssues", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'safety_issues', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "safetyIssues", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'materials_used', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "materialsUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'equipment_used', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "equipmentUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'next_day_plan', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "nextDayPlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'problems_encountered', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "problemsEncountered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'weather_condition', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "weatherCondition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'change_order_id', nullable: true }),
    __metadata("design:type", String)
], DailyReport.prototype, "changeOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => change_order_entity_1.ChangeOrder, (changeOrder) => changeOrder.dailyReports, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'change_order_id' }),
    __metadata("design:type", change_order_entity_1.ChangeOrder)
], DailyReport.prototype, "changeOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", String)
], DailyReport.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], DailyReport.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sign_off_entity_1.SignOff, (signOff) => signOff.dailyReport),
    __metadata("design:type", Array)
], DailyReport.prototype, "signOffs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], DailyReport.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DailyReport.prototype, "metadata", void 0);
exports.DailyReport = DailyReport = __decorate([
    (0, typeorm_1.Entity)('daily_reports')
], DailyReport);
//# sourceMappingURL=daily-report.entity.js.map