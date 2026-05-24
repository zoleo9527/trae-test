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
const work_order_status_enum_1 = require("../../common/enums/work-order-status.enum");
const student_entity_1 = require("../student/student.entity");
const consultant_entity_1 = require("../consultant/consultant.entity");
const refund_entity_1 = require("../refund/refund.entity");
const transfer_entity_1 = require("../transfer/transfer.entity");
const material_entity_1 = require("../material/material.entity");
const comment_entity_1 = require("../comment/comment.entity");
const deadline_entity_1 = require("../deadline/deadline.entity");
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
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: work_order_status_enum_1.WorkOrderStatus,
        default: work_order_status_enum_1.WorkOrderStatus.PENDING,
    }),
    __metadata("design:type", String)
], WorkOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkOrder.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, student => student.workOrders, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], WorkOrder.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkOrder.prototype, "currentConsultantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consultant_entity_1.Consultant),
    (0, typeorm_1.JoinColumn)({ name: 'currentConsultantId' }),
    __metadata("design:type", consultant_entity_1.Consultant)
], WorkOrder.prototype, "currentConsultant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "previousConsultantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consultant_entity_1.Consultant),
    (0, typeorm_1.JoinColumn)({ name: 'previousConsultantId' }),
    __metadata("design:type", consultant_entity_1.Consultant)
], WorkOrder.prototype, "previousConsultant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], WorkOrder.prototype, "expectedDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "serviceContent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refund_entity_1.Refund, refund => refund.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "refunds", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transfer_entity_1.Transfer, transfer => transfer.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "transfers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => material_entity_1.Material, material => material.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "materials", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, comment => comment.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => deadline_entity_1.Deadline, deadline => deadline.workOrder),
    __metadata("design:type", Array)
], WorkOrder.prototype, "deadlines", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkOrder.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WorkOrder.prototype, "updatedBy", void 0);
exports.WorkOrder = WorkOrder = __decorate([
    (0, typeorm_1.Entity)('work_orders')
], WorkOrder);
//# sourceMappingURL=work-order.entity.js.map