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
exports.WorkOrderItem = exports.ItemHandoverStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const work_order_entity_1 = require("./work-order.entity");
const product_entity_1 = require("./product.entity");
var ItemHandoverStatus;
(function (ItemHandoverStatus) {
    ItemHandoverStatus["PENDING"] = "pending";
    ItemHandoverStatus["RECEIVED"] = "received";
    ItemHandoverStatus["RETURNED"] = "returned";
    ItemHandoverStatus["SHIPPED"] = "shipped";
})(ItemHandoverStatus || (exports.ItemHandoverStatus = ItemHandoverStatus = {}));
let WorkOrderItem = class WorkOrderItem extends base_entity_1.BaseEntity {
};
exports.WorkOrderItem = WorkOrderItem;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'work_order_id' }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, (workOrder) => workOrder.items),
    (0, typeorm_1.JoinColumn)({ name: 'work_order_id' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], WorkOrderItem.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (product) => product.workOrderItems),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], WorkOrderItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'item_name' }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'item_spec' }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "itemSpec", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], WorkOrderItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'item_value' }),
    __metadata("design:type", Number)
], WorkOrderItem.prototype, "itemValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ItemHandoverStatus,
        default: ItemHandoverStatus.PENDING,
        name: 'handover_status',
    }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "handoverStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'condition_before', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "conditionBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'condition_after', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "conditionAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'handover_remark', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "handoverRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'image_urls_before', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "imageUrlsBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'image_urls_after', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "imageUrlsAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'received_at', nullable: true }),
    __metadata("design:type", Date)
], WorkOrderItem.prototype, "receivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'received_by', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "receivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'returned_at', nullable: true }),
    __metadata("design:type", Date)
], WorkOrderItem.prototype, "returnedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'returned_by', nullable: true }),
    __metadata("design:type", String)
], WorkOrderItem.prototype, "returnedBy", void 0);
exports.WorkOrderItem = WorkOrderItem = __decorate([
    (0, typeorm_1.Entity)('work_order_items')
], WorkOrderItem);
//# sourceMappingURL=work-order-item.entity.js.map