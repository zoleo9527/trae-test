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
exports.Material = void 0;
const typeorm_1 = require("typeorm");
const material_status_enum_1 = require("../../common/enums/material-status.enum");
const work_order_entity_1 = require("../work-order/work-order.entity");
const consultant_entity_1 = require("../consultant/consultant.entity");
const material_version_entity_1 = require("./material-version.entity");
const comment_entity_1 = require("../comment/comment.entity");
let Material = class Material {
};
exports.Material = Material;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Material.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Material.prototype, "workOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => work_order_entity_1.WorkOrder, workOrder => workOrder.materials, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workOrderId' }),
    __metadata("design:type", work_order_entity_1.WorkOrder)
], Material.prototype, "workOrder", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Material.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: material_status_enum_1.MaterialType,
    }),
    __metadata("design:type", String)
], Material.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: material_status_enum_1.MaterialStatus,
        default: material_status_enum_1.MaterialStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Material.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Material.prototype, "currentVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Material.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Material.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Material.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Material.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => consultant_entity_1.Consultant),
    (0, typeorm_1.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", consultant_entity_1.Consultant)
], Material.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => material_version_entity_1.MaterialVersion, version => version.material, { cascade: true }),
    __metadata("design:type", Array)
], Material.prototype, "versions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, comment => comment.material),
    __metadata("design:type", Array)
], Material.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Material.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Material.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Material.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Material.prototype, "updatedBy", void 0);
exports.Material = Material = __decorate([
    (0, typeorm_1.Entity)('materials')
], Material);
//# sourceMappingURL=material.entity.js.map