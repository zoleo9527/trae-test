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
exports.Transfer = void 0;
const typeorm_1 = require("typeorm");
const transfer_status_enum_1 = require("../../common/enums/transfer-status.enum");
const work_order_entity_1 = require("../work-order/work-order.entity");
const consultant_entity_1 = require("../consultant/consultant.entity");
const comment_entity_1 = require("../comment/comment.entity");
let Transfer = class Transfer {
};
exports.Transfer = Transfer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Transfer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Transfer.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, workOrder => workOrder.transfers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workOrderId' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], Transfer.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Transfer.prototype, "fromConsultantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consultant_entity_1.Consultant),
    (0, typeorm_1.JoinColumn)({ name: 'fromConsultantId' }),
    __metadata("design:type", consultant_entity_1.Consultant)
], Transfer.prototype, "fromConsultant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Transfer.prototype, "toConsultantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consultant_entity_1.Consultant),
    (0, typeorm_1.JoinColumn)({ name: 'toConsultantId' }),
    __metadata("design:type", consultant_entity_1.Consultant)
], Transfer.prototype, "toConsultant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Transfer.prototype, "handoverContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transfer.prototype, "keyNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transfer.prototype, "pendingItems", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: transfer_status_enum_1.TransferStatus,
        default: transfer_status_enum_1.TransferStatus.INITIATED,
    }),
    __metadata("design:type", String)
], Transfer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Transfer.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Transfer.prototype, "receivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Transfer.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Transfer.prototype, "initiatorId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, comment => comment.transfer),
    __metadata("design:type", Array)
], Transfer.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Transfer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Transfer.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Transfer.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Transfer.prototype, "updatedBy", void 0);
exports.Transfer = Transfer = __decorate([
    (0, typeorm_1.Entity)('transfers')
], Transfer);
//# sourceMappingURL=transfer.entity.js.map