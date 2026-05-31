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
exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const delivery_service_1 = require("./delivery.service");
const create_delivery_dto_1 = require("./dto/create-delivery.dto");
const update_delivery_dto_1 = require("./dto/update-delivery.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const delivery_entity_1 = require("./entities/delivery.entity");
let DeliveryController = class DeliveryController {
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    create(req, createDeliveryDto) {
        return this.deliveryService.create(createDeliveryDto, req.user);
    }
    findAll(page = 1, limit = 20, projectId, status) {
        return this.deliveryService.findAll(page, limit, { projectId, status });
    }
    findOne(id) {
        return this.deliveryService.findOne(id);
    }
    update(req, id, updateDeliveryDto) {
        return this.deliveryService.update(id, updateDeliveryDto, req.user);
    }
    receive(req, id) {
        return this.deliveryService.receive(id, req.user);
    }
    findByChangeOrder(changeOrderId) {
        return this.deliveryService.findByChangeOrder(changeOrderId);
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建发货回单' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_delivery_dto_1.CreateDeliveryDto]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取发货回单列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: delivery_entity_1.DeliveryStatus }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('projectId')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取发货回单详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新发货回单' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_delivery_dto_1.UpdateDeliveryDto]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    (0, swagger_1.ApiOperation)({ summary: '确认收货' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "receive", null);
__decorate([
    (0, common_1.Get)('change-order/:changeOrderId'),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单关联的发货回单' }),
    __param(0, (0, common_1.Param)('changeOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "findByChangeOrder", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, swagger_1.ApiTags)('发货回单'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('deliveries'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DeliveryController);
//# sourceMappingURL=delivery.controller.js.map