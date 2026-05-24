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
exports.AuditLog = exports.AuditModule = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["STATUS_CHANGE"] = "status_change";
    AuditAction["HANDOVER"] = "handover";
    AuditAction["APPROVE"] = "approve";
    AuditAction["REJECT"] = "reject";
    AuditAction["CONFIRM"] = "confirm";
    AuditAction["CANCEL"] = "cancel";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditModule;
(function (AuditModule) {
    AuditModule["WORK_ORDER"] = "work_order";
    AuditModule["REPAIR"] = "repair";
    AuditModule["FOLLOW_UP"] = "follow_up";
    AuditModule["MEMBER"] = "member";
    AuditModule["PRODUCT"] = "product";
    AuditModule["USER"] = "user";
    AuditModule["SYSTEM"] = "system";
})(AuditModule || (exports.AuditModule = AuditModule = {}));
let AuditLog = class AuditLog extends base_entity_1.BaseEntity {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditModule }),
    __metadata("design:type", String)
], AuditLog.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'record_id' }),
    __metadata("design:type", String)
], AuditLog.prototype, "recordId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditAction }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'operator_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.auditLogs),
    (0, typeorm_1.JoinColumn)({ name: 'operator_id' }),
    __metadata("design:type", user_entity_1.User)
], AuditLog.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'operator_name', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'action_description' }),
    __metadata("design:type", String)
], AuditLog.prototype, "actionDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'old_values', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "oldValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'new_values', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "newValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'user_agent', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs')
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map