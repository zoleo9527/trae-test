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
exports.WorkOrder = exports.WorkOrderStatus = exports.WorkOrderPriority = exports.WorkOrderType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const member_entity_1 = require("./member.entity");
const user_entity_1 = require("./user.entity");
const work_order_item_entity_1 = require("./work-order-item.entity");
const repair_entity_1 = require("./repair.entity");
const follow_up_entity_1 = require("./follow-up.entity");
const status_history_entity_1 = require("./status-history.entity");
var WorkOrderType;
(function (WorkOrderType) {
    WorkOrderType["REPAIR"] = "repair";
    WorkOrderType["CUSTOM"] = "custom";
    WorkOrderType["TRANSFER"] = "transfer";
    WorkOrderType["RETURN"] = "return";
    WorkOrderType["EXCHANGE"] = "exchange";
    WorkOrderType["CLEANING"] = "cleaning";
})(WorkOrderType || (exports.WorkOrderType = WorkOrderType = {}));
var WorkOrderPriority;
(function (WorkOrderPriority) {
    WorkOrderPriority["LOW"] = "low";
    WorkOrderPriority["NORMAL"] = "normal";
    WorkOrderPriority["HIGH"] = "high";
    WorkOrderPriority["URGENT"] = "urgent";
})(WorkOrderPriority || (exports.WorkOrderPriority = WorkOrderPriority = {}));
var WorkOrderStatus;
(function (WorkOrderStatus) {
    WorkOrderStatus["DRAFT"] = "draft";
    WorkOrderStatus["PENDING_REVIEW"] = "pending_review";
    WorkOrderStatus["REVIEWED"] = "reviewed";
    WorkOrderStatus["IN_PROGRESS"] = "in_progress";
    WorkOrderStatus["PENDING_CONFIRM"] = "pending_confirm";
    WorkOrderStatus["COMPLETED"] = "completed";
    WorkOrderStatus["REJECTED"] = "rejected";
    WorkOrderStatus["CANCELLED"] = "cancelled";
    WorkOrderStatus["NEEDS_REVIEW"] = "needs_review";
})(WorkOrderStatus || (exports.WorkOrderStatus = WorkOrderStatus = {}));
let WorkOrder = class WorkOrder extends base_entity_1.BaseEntity {
};
exports.WorkOrder = WorkOrder;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'order_no', unique: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "orderNo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkOrderType,
        default: WorkOrderType.REPAIR,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkOrderPriority,
        default: WorkOrderPriority.NORMAL,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkOrderStatus,
        default: WorkOrderStatus.DRAFT,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'member_id' }),
    __metadata("design:type", String)
], WorkOrder.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, (member) => member.workOrders),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_entity_1.Member)
], WorkOrder.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'handler_id', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "handlerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.handledOrders),
    (0, typeorm_1.JoinColumn)({ name: 'handler_id' }),
    __metadata("design:type", user_entity_1.User)
], WorkOrder.prototype, "handler", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'problem_description' }),
    __metadata("design:type", String)
], WorkOrder.prototype, "problemDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'customer_requirement', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "customerRequirement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'internal_note', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "internalNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'estimated_cost' }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "estimatedCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'actual_cost' }),
    __metadata("design:type", Number)
], WorkOrder.prototype, "actualCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expected_completion_at', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "expectedCompletionAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'needs_follow_up', default: true }),
    __metadata("design:type", Boolean)
], WorkOrder.prototype, "needsFollowUp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_payment_confirmed', default: false }),
    __metadata("design:type", Boolean)
], WorkOrder.prototype, "isPaymentConfirmed", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_item_entity_1.WorkOrderItem, (item) => item.workOrder, { cascade: true }),
    __metadata("design:type", Array)
], WorkOrder.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => repair_entity_1.Repair, (repair) => repair.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "repairs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => follow_up_entity_1.FollowUp, (followUp) => followUp.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "followUps", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => status_history_entity_1.StatusHistory, (history) => history.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "statusHistories", void 0);
exports.WorkOrder = WorkOrder = __decorate([
    (0, typeorm_1.Entity)('work_orders')
], WorkOrder);
//# sourceMappingURL=work-order.entity.js.map