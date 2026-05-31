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
exports.ChangeOrderVersion = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const change_order_entity_1 = require("./change-order.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let ChangeOrderVersion = class ChangeOrderVersion extends base_entity_1.BaseEntity {
};
exports.ChangeOrderVersion = ChangeOrderVersion;
__decorate([
    (0, typeorm_1.Column)({ name: 'change_order_id' }),
    __metadata("design:type", String)
], ChangeOrderVersion.prototype, "changeOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => change_order_entity_1.ChangeOrder, (changeOrder) => changeOrder.versions),
    (0, typeorm_1.JoinColumn)({ name: 'change_order_id' }),
    __metadata("design:type", change_order_entity_1.ChangeOrder)
], ChangeOrderVersion.prototype, "changeOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'version_number' }),
    __metadata("design:type", Number)
], ChangeOrderVersion.prototype, "versionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'snapshot_data' }),
    __metadata("design:type", Object)
], ChangeOrderVersion.prototype, "snapshotData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'change_summary', nullable: true }),
    __metadata("design:type", String)
], ChangeOrderVersion.prototype, "changeSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'changes' }),
    __metadata("design:type", Array)
], ChangeOrderVersion.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", String)
], ChangeOrderVersion.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], ChangeOrderVersion.prototype, "createdBy", void 0);
exports.ChangeOrderVersion = ChangeOrderVersion = __decorate([
    (0, typeorm_1.Entity)('change_order_versions')
], ChangeOrderVersion);
//# sourceMappingURL=change-order-version.entity.js.map