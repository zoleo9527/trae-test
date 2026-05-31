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
exports.ChangeOrderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const change_order_service_1 = require("./change-order.service");
const create_change_order_dto_1 = require("./dto/create-change-order.dto");
const update_change_order_dto_1 = require("./dto/update-change-order.dto");
const status_transition_dto_1 = require("./dto/status-transition.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const change_order_status_enum_1 = require("../common/enums/change-order-status.enum");
let ChangeOrderController = class ChangeOrderController {
    constructor(changeOrderService) {
        this.changeOrderService = changeOrderService;
    }
    create(req, createChangeOrderDto) {
        return this.changeOrderService.create(createChangeOrderDto, req.user);
    }
    findAll(page = 1, limit = 20, status, projectId) {
        return this.changeOrderService.findAll(page, limit, { status, projectId });
    }
    getPending(req) {
        return this.changeOrderService.getPendingForUser(req.user);
    }
    getRejected(req) {
        return this.changeOrderService.getRejectedForUser(req.user);
    }
    getNeedsReview(req) {
        return this.changeOrderService.getNeedsReview(req.user);
    }
    getStatistics() {
        return this.changeOrderService.getStatistics();
    }
    findOne(id) {
        return this.changeOrderService.findOne(id);
    }
    getVersions(id) {
        return this.changeOrderService.getVersions(id);
    }
    getVersion(id, versionNumber) {
        return this.changeOrderService.getVersion(id, versionNumber);
    }
    update(req, id, updateChangeOrderDto) {
        return this.changeOrderService.update(id, updateChangeOrderDto, req.user);
    }
    transitionStatus(req, id, transitionDto) {
        return this.changeOrderService.transitionStatus(id, transitionDto, req.user);
    }
};
exports.ChangeOrderController = ChangeOrderController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.PROJECT_MANAGER, role_enum_1.Role.SUPERVISOR),
    (0, swagger_1.ApiOperation)({ summary: '创建变更单' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_change_order_dto_1.CreateChangeOrderDto]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: change_order_status_enum_1.ChangeOrderStatus }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: '获取待处理的变更单' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "getPending", null);
__decorate([
    (0, common_1.Get)('rejected'),
    (0, swagger_1.ApiOperation)({ summary: '获取已驳回的变更单' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "getRejected", null);
__decorate([
    (0, common_1.Get)('needs-review'),
    (0, swagger_1.ApiOperation)({ summary: '获取需回查的变更单' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "getNeedsReview", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单统计数据' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单版本历史' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Get)(':id/versions/:versionNumber'),
    (0, swagger_1.ApiOperation)({ summary: '获取指定版本详情' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('versionNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.PROJECT_MANAGER, role_enum_1.Role.SUPERVISOR),
    (0, swagger_1.ApiOperation)({ summary: '更新变更单' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_change_order_dto_1.UpdateChangeOrderDto]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/transition'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.PROJECT_MANAGER, role_enum_1.Role.SUPERVISOR),
    (0, swagger_1.ApiOperation)({ summary: '变更单状态流转' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, status_transition_dto_1.StatusTransitionDto]),
    __metadata("design:returntype", void 0)
], ChangeOrderController.prototype, "transitionStatus", null);
exports.ChangeOrderController = ChangeOrderController = __decorate([
    (0, swagger_1.ApiTags)('变更单管理'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('change-orders'),
    __metadata("design:paramtypes", [change_order_service_1.ChangeOrderService])
], ChangeOrderController);
//# sourceMappingURL=change-order.controller.js.map