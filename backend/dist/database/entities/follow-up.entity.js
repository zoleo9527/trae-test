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
exports.FollowUp = exports.FollowUpStatus = exports.FollowUpResult = exports.FollowUpChannel = exports.FollowUpType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const member_entity_1 = require("./member.entity");
const work_order_entity_1 = require("./work-order.entity");
const user_entity_1 = require("./user.entity");
var FollowUpType;
(function (FollowUpType) {
    FollowUpType["AFTER_SALES"] = "after_sales";
    FollowUpType["REPAIR_COMPLETED"] = "repair_completed";
    FollowUpType["BIRTHDAY"] = "birthday";
    FollowUpType["MEMBER_CARE"] = "member_care";
    FollowUpType["COMPLAINT"] = "complaint";
    FollowUpType["OTHER"] = "other";
})(FollowUpType || (exports.FollowUpType = FollowUpType = {}));
var FollowUpChannel;
(function (FollowUpChannel) {
    FollowUpChannel["PHONE"] = "phone";
    FollowUpChannel["WECHAT"] = "wechat";
    FollowUpChannel["SMS"] = "sms";
    FollowUpChannel["EMAIL"] = "email";
    FollowUpChannel["IN_PERSON"] = "in_person";
})(FollowUpChannel || (exports.FollowUpChannel = FollowUpChannel = {}));
var FollowUpResult;
(function (FollowUpResult) {
    FollowUpResult["SATISFIED"] = "satisfied";
    FollowUpResult["PARTIALLY_SATISFIED"] = "partially_satisfied";
    FollowUpResult["DISSATISFIED"] = "dissatisfied";
    FollowUpResult["NO_ANSWER"] = "no_answer";
    FollowUpResult["CALL_BACK_LATER"] = "call_back_later";
})(FollowUpResult || (exports.FollowUpResult = FollowUpResult = {}));
var FollowUpStatus;
(function (FollowUpStatus) {
    FollowUpStatus["PENDING"] = "pending";
    FollowUpStatus["IN_PROGRESS"] = "in_progress";
    FollowUpStatus["COMPLETED"] = "completed";
    FollowUpStatus["CANCELLED"] = "cancelled";
})(FollowUpStatus || (exports.FollowUpStatus = FollowUpStatus = {}));
let FollowUp = class FollowUp extends base_entity_1.BaseEntity {
};
exports.FollowUp = FollowUp;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'follow_up_no', unique: true }),
    __metadata("design:type", String)
], FollowUp.prototype, "followUpNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'member_id' }),
    __metadata("design:type", String)
], FollowUp.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, (member) => member.followUps),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_entity_1.Member)
], FollowUp.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'work_order_id', nullable: true }),
    __metadata("design:type", String)
], FollowUp.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, (workOrder) => workOrder.followUps),
    (0, typeorm_1.JoinColumn)({ name: 'work_order_id' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], FollowUp.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FollowUpType,
        default: FollowUpType.AFTER_SALES,
    }),
    __metadata("design:type", String)
], FollowUp.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FollowUpChannel,
        default: FollowUpChannel.PHONE,
    }),
    __metadata("design:type", String)
], FollowUp.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FollowUpStatus,
        default: FollowUpStatus.PENDING,
    }),
    __metadata("design:type", String)
], FollowUp.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: FollowUpResult, nullable: true }),
    __metadata("design:type", String)
], FollowUp.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], FollowUp.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to' }),
    __metadata("design:type", user_entity_1.User)
], FollowUp.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'follow_up_content' }),
    __metadata("design:type", String)
], FollowUp.prototype, "followUpContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'customer_feedback', nullable: true }),
    __metadata("design:type", String)
], FollowUp.prototype, "customerFeedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'internal_note' }),
    __metadata("design:type", String)
], FollowUp.prototype, "internalNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'planned_at' }),
    __metadata("design:type", Date)
], FollowUp.prototype, "plannedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'actual_at', nullable: true }),
    __metadata("design:type", Date)
], FollowUp.prototype, "actualAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'follow_up_count', default: 0 }),
    __metadata("design:type", Number)
], FollowUp.prototype, "followUpCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'next_follow_up_at', nullable: true }),
    __metadata("design:type", Date)
], FollowUp.prototype, "nextFollowUpAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'needs_escalation', default: false }),
    __metadata("design:type", Boolean)
], FollowUp.prototype, "needsEscalation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'escalation_reason', nullable: true }),
    __metadata("design:type", String)
], FollowUp.prototype, "escalationReason", void 0);
exports.FollowUp = FollowUp = __decorate([
    (0, typeorm_1.Entity)('follow_ups')
], FollowUp);
//# sourceMappingURL=follow-up.entity.js.map