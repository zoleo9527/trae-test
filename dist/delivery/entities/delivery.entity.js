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
exports.Delivery = exports.DeliveryStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../user/entities/user.entity");
const change_order_entity_1 = require("../../change-order/entities/change-order.entity");
const sign_off_entity_1 = require("../../sign-off/entities/sign-off.entity");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["IN_TRANSIT"] = "in_transit";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["RECEIVED"] = "received";
    DeliveryStatus["PARTIAL_RECEIVED"] = "partial_received";
    DeliveryStatus["RETURNED"] = "returned";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let Delivery = class Delivery extends base_entity_1.BaseEntity {
};
exports.Delivery = Delivery;
__decorate([
    (0, typeorm_1.Column)({ unique: true, name: 'delivery_number' }),
    __metadata("design:type", String)
], Delivery.prototype, "deliveryNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], Delivery.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_name' }),
    __metadata("design:type", String)
], Delivery.prototype, "projectName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DeliveryStatus,
        default: DeliveryStatus.PENDING,
    }),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_name', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "supplierName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'driver_name', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "driverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_number', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "vehicleNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expected_delivery_date', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "expectedDeliveryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'actual_delivery_date', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "actualDeliveryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_location', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "deliveryLocation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'materials' }),
    __metadata("design:type", String)
], Delivery.prototype, "materials", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'total_quantity', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Delivery.prototype, "totalQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'received_quantity', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Delivery.prototype, "receivedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'quality_check_notes', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "qualityCheckNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'damage_notes', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "damageNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'tracking_info', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "trackingInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'change_order_id', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "changeOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => change_order_entity_1.ChangeOrder, (changeOrder) => changeOrder.deliveries, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'change_order_id' }),
    __metadata("design:type", change_order_entity_1.ChangeOrder)
], Delivery.prototype, "changeOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", String)
], Delivery.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Delivery.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_by_id', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "receivedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'received_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Delivery.prototype, "receivedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sign_off_entity_1.SignOff, (signOff) => signOff.delivery),
    __metadata("design:type", Array)
], Delivery.prototype, "signOffs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Delivery.prototype, "materialsList", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Delivery.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Delivery.prototype, "metadata", void 0);
exports.Delivery = Delivery = __decorate([
    (0, typeorm_1.Entity)('deliveries')
], Delivery);
//# sourceMappingURL=delivery.entity.js.map