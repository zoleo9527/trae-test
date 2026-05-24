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
exports.Repair = exports.RepairStatus = exports.RepairType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const work_order_entity_1 = require("./work-order.entity");
const repair_step_entity_1 = require("./repair-step.entity");
var RepairType;
(function (RepairType) {
    RepairType["POLISHING"] = "polishing";
    RepairType["SOLDERING"] = "soldering";
    RepairType["RESIZING"] = "resizing";
    RepairType["STONE_REPLACEMENT"] = "stone_replacement";
    RepairType["CHAIN_REPAIR"] = "chain_repair";
    RepairType["CLASP_REPAIR"] = "clasp_repair";
    RepairType["REFURBISHMENT"] = "refurbishment";
    RepairType["CUSTOM_MODIFICATION"] = "custom_modification";
    RepairType["OTHER"] = "other";
})(RepairType || (exports.RepairType = RepairType = {}));
var RepairStatus;
(function (RepairStatus) {
    RepairStatus["PENDING"] = "pending";
    RepairStatus["IN_PROGRESS"] = "in_progress";
    RepairStatus["NEEDS_QUOTATION"] = "needs_quotation";
    RepairStatus["QUOTATION_APPROVED"] = "quotation_approved";
    RepairStatus["QUOTATION_REJECTED"] = "quotation_rejected";
    RepairStatus["COMPLETED"] = "completed";
    RepairStatus["CANCELLED"] = "cancelled";
})(RepairStatus || (exports.RepairStatus = RepairStatus = {}));
let Repair = class Repair extends base_entity_1.BaseEntity {
};
exports.Repair = Repair;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'work_order_id' }),
    __metadata("design:type", String)
], Repair.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, (workOrder) => workOrder.repairs),
    (0, typeorm_1.JoinColumn)({ name: 'work_order_id' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], Repair.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'repair_no', unique: true }),
    __metadata("design:type", String)
], Repair.prototype, "repairNo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RepairType,
        default: RepairType.OTHER,
    }),
    __metadata("design:type", String)
], Repair.prototype, "repairType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RepairStatus,
        default: RepairStatus.PENDING,
    }),
    __metadata("design:type", String)
], Repair.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'repair_description' }),
    __metadata("design:type", String)
], Repair.prototype, "repairDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'technician_note', nullable: true }),
    __metadata("design:type", String)
], Repair.prototype, "technicianNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'parts_cost' }),
    __metadata("design:type", Number)
], Repair.prototype, "partsCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'labor_cost' }),
    __metadata("design:type", Number)
], Repair.prototype, "laborCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_cost' }),
    __metadata("design:type", Number)
], Repair.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_warranty', default: false }),
    __metadata("design:type", Boolean)
], Repair.prototype, "isWarranty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'warranty_terms', nullable: true }),
    __metadata("design:type", String)
], Repair.prototype, "warrantyTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'started_at', nullable: true }),
    __metadata("design:type", Date)
], Repair.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], Repair.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'technician_id', nullable: true }),
    __metadata("design:type", String)
], Repair.prototype, "technicianId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => repair_step_entity_1.RepairStep, (step) => step.repair, { cascade: true }),
    __metadata("design:type", Array)
], Repair.prototype, "steps", void 0);
exports.Repair = Repair = __decorate([
    (0, typeorm_1.Entity)('repairs')
], Repair);
//# sourceMappingURL=repair.entity.js.map