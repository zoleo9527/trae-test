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
exports.RepairStep = exports.StepStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const repair_entity_1 = require("./repair.entity");
var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "pending";
    StepStatus["IN_PROGRESS"] = "in_progress";
    StepStatus["COMPLETED"] = "completed";
    StepStatus["SKIPPED"] = "skipped";
})(StepStatus || (exports.StepStatus = StepStatus = {}));
let RepairStep = class RepairStep extends base_entity_1.BaseEntity {
};
exports.RepairStep = RepairStep;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'repair_id' }),
    __metadata("design:type", String)
], RepairStep.prototype, "repairId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => repair_entity_1.Repair, (repair) => repair.steps),
    (0, typeorm_1.JoinColumn)({ name: 'repair_id' }),
    __metadata("design:type", repair_entity_1.Repair)
], RepairStep.prototype, "repair", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'step_order' }),
    __metadata("design:type", Number)
], RepairStep.prototype, "stepOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'step_name' }),
    __metadata("design:type", String)
], RepairStep.prototype, "stepName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'step_description' }),
    __metadata("design:type", String)
], RepairStep.prototype, "stepDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: StepStatus,
        default: StepStatus.PENDING,
    }),
    __metadata("design:type", String)
], RepairStep.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'operator_note' }),
    __metadata("design:type", String)
], RepairStep.prototype, "operatorNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'started_at', nullable: true }),
    __metadata("design:type", Date)
], RepairStep.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], RepairStep.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'operator_id', nullable: true }),
    __metadata("design:type", String)
], RepairStep.prototype, "operatorId", void 0);
exports.RepairStep = RepairStep = __decorate([
    (0, typeorm_1.Entity)('repair_steps')
], RepairStep);
//# sourceMappingURL=repair-step.entity.js.map