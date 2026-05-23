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
exports.WorkOrder = void 0;
const typeorm_1 = require("typeorm");
const work_order_enum_1 = require("../common/enums/work-order.enum");
const user_entity_1 = require("./user.entity");
const downtime_record_entity_1 = require("./downtime-record.entity");
const part_usage_entity_1 = require("./part-usage.entity");
const review_record_entity_1 = require("./review-record.entity");
const status_history_entity_1 = require("./status-history.entity");
let WorkOrder = class WorkOrder {
};
exports.WorkOrder = WorkOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "orderNo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkOrder.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: work_order_enum_1.WorkOrderStatus,
        default: work_order_enum_1.WorkOrderStatus.ABNORMAL_REPORTED,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: work_order_enum_1.AbnormalType,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "abnormalType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "equipmentNo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkOrder.prototype, "station", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "powerLoss", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "totalDowntimeMinutes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'reporterId' }),
    __metadata("design:type", user_entity_1.User)
], WorkOrder.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'handlerId' }),
    __metadata("design:type", user_entity_1.User)
], WorkOrder.prototype, "handler", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "handlerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => downtime_record_entity_1.DowntimeRecord, record => record.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "downtimeRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => part_usage_entity_1.PartUsage, usage => usage.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "partUsages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => review_record_entity_1.ReviewRecord, review => review.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "reviewRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => status_history_entity_1.StatusHistory, history => history.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "statusHistories", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrder.prototype, "updatedAt", void 0);
exports.WorkOrder = WorkOrder = __decorate([
    (0, typeorm_1.Entity)('work_orders')
], WorkOrder);
//# sourceMappingURL=work-order.entity.js.map