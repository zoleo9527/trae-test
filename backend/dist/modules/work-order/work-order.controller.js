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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const work_order_service_1 = require("./work-order.service");
const auth_1 = require("../../common/auth");
const entities_1 = require("../../database/entities");
let WorkOrderController = class WorkOrderController {
    constructor(workOrderService) {
        this.workOrderService = workOrderService;
    }
    create(dto, user) {
        return this.workOrderService.create(dto, user);
    }
    findAll(status, type, memberId, handlerId, page = 1, limit = 20) {
        return this.workOrderService.findAll({ status, type, memberId, handlerId }, Number(page), Number(limit));
    }
    getDashboardStats() {
        return this.workOrderService.getDashboardStats();
    }
    findOne(id) {
        return this.workOrderService.findOne(id);
    }
    update(id, dto, user) {
        return this.workOrderService.update(id, dto, user);
    }
    changeStatus(id, dto, user) {
        return this.workOrderService.changeStatus(id, dto, user);
    }
    getStatusHistories(id) {
        return this.workOrderService.getStatusHistories(id);
    }
    getAuditLogs(id) {
        return this.workOrderService.getAuditLogs(id);
    }
    receiveItem(workOrderId, itemId, dto, user) {
        return this.workOrderService.receiveItem(workOrderId, itemId, dto, user);
    }
    returnItem(workOrderId, itemId, dto, user) {
        return this.workOrderService.returnItem(workOrderId, itemId, dto, user);
    }
};
exports.WorkOrderController = WorkOrderController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, entities_1.User]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('memberId')),
    __param(3, (0, common_1.Query)('handlerId')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, entities_1.User]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, entities_1.User]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Get)(':id/histories'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "getStatusHistories", null);
__decorate([
    (0, common_1.Get)(':id/audit-logs'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Put)(':id/items/:itemId/receive'),
    (0, auth_1.Roles)(entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, entities_1.User]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "receiveItem", null);
__decorate([
    (0, common_1.Put)(':id/items/:itemId/return'),
    (0, auth_1.Roles)(entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, entities_1.User]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "returnItem", null);
exports.WorkOrderController = WorkOrderController = __decorate([
    (0, common_1.Controller)('work-orders'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [work_order_service_1.WorkOrderService])
], WorkOrderController);
//# sourceMappingURL=work-order.controller.js.map