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
exports.StatusHistory = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const work_order_entity_1 = require("./work-order.entity");
const user_entity_1 = require("./user.entity");
let StatusHistory = class StatusHistory extends base_entity_1.BaseEntity {
};
exports.StatusHistory = StatusHistory;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'work_order_id' }),
    __metadata("design:type", String)
], StatusHistory.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, (workOrder) => workOrder.statusHistories),
    (0, typeorm_1.JoinColumn)({ name: 'work_order_id' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], StatusHistory.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'from_status' }),
    __metadata("design:type", String)
], StatusHistory.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'to_status' }),
    __metadata("design:type", String)
], StatusHistory.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'operator_id', nullable: true }),
    __metadata("design:type", String)
], StatusHistory.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'operator_id' }),
    __metadata("design:type", user_entity_1.User)
], StatusHistory.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'change_reason', nullable: true }),
    __metadata("design:type", String)
], StatusHistory.prototype, "changeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'remark', nullable: true }),
    __metadata("design:type", String)
], StatusHistory.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'snapshot_data', nullable: true }),
    __metadata("design:type", Object)
], StatusHistory.prototype, "snapshotData", void 0);
exports.StatusHistory = StatusHistory = __decorate([
    (0, typeorm_1.Entity)('status_histories')
], StatusHistory);
//# sourceMappingURL=status-history.entity.js.map