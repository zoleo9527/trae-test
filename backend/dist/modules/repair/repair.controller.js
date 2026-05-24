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
exports.RepairController = void 0;
const common_1 = require("@nestjs/common");
const repair_service_1 = require("./repair.service");
const auth_1 = require("../../common/auth");
const entities_1 = require("../../database/entities");
let RepairController = class RepairController {
    constructor(repairService) {
        this.repairService = repairService;
    }
    create(dto, req) {
        return this.repairService.create(dto, req.user);
    }
    findAll(status, repairType, workOrderId, technicianId, page = 1, limit = 20) {
        return this.repairService.findAll({ status: status, repairType: repairType, workOrderId, technicianId }, Number(page), Number(limit));
    }
    findByWorkOrderId(workOrderId) {
        return this.repairService.findByWorkOrderId(workOrderId);
    }
    findOne(id) {
        return this.repairService.findOne(id);
    }
    getAvailableTransitions(id, req) {
        return this.repairService.getAvailableTransitions(id, req.user.role);
    }
    update(id, dto, req) {
        return this.repairService.update(id, dto, req.user);
    }
    changeStatus(id, dto, req) {
        return this.repairService.changeStatus(id, dto, req.user);
    }
    addStep(repairId, stepDto, req) {
        return this.repairService.addStep(repairId, stepDto, req.user);
    }
    updateStep(stepId, dto, req) {
        return this.repairService.updateStep(stepId, dto, req.user);
    }
};
exports.RepairController = RepairController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_1.Roles)(entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('repairType')),
    __param(2, (0, common_1.Query)('workOrderId')),
    __param(3, (0, common_1.Query)('technicianId')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('work-order/:workOrderId'),
    __param(0, (0, common_1.Param)('workOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "findByWorkOrderId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/transitions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "getAvailableTransitions", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_1.Roles)(entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, auth_1.Roles)(entities_1.UserRole.WORKSHOP, entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Post)(':id/steps'),
    (0, auth_1.Roles)(entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "addStep", null);
__decorate([
    (0, common_1.Put)('steps/:stepId'),
    (0, auth_1.Roles)(entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('stepId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RepairController.prototype, "updateStep", null);
exports.RepairController = RepairController = __decorate([
    (0, common_1.Controller)('repairs'),
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    __metadata("design:paramtypes", [repair_service_1.RepairService])
], RepairController);
//# sourceMappingURL=repair.controller.js.map