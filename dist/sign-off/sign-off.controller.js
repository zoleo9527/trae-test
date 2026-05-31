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
exports.SignOffController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sign_off_service_1 = require("./sign-off.service");
const create_sign_off_dto_1 = require("./dto/create-sign-off.dto");
const action_sign_off_dto_1 = require("./dto/action-sign-off.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const sign_off_enum_1 = require("../common/enums/sign-off.enum");
let SignOffController = class SignOffController {
    constructor(signOffService) {
        this.signOffService = signOffService;
    }
    create(req, createSignOffDto) {
        return this.signOffService.create(createSignOffDto, req.user);
    }
    findAll(page = 1, limit = 20, status, signOffType) {
        return this.signOffService.findAll(page, limit, { status, signOffType });
    }
    getPending(req) {
        return this.signOffService.getPendingForUser(req.user);
    }
    getMySigned(req) {
        return this.signOffService.getMySigned(req.user);
    }
    getMyRequested(req) {
        return this.signOffService.getMyRequested(req.user);
    }
    findOne(id) {
        return this.signOffService.findOne(id);
    }
    sign(req, id, actionDto) {
        return this.signOffService.sign(id, actionDto, req.user);
    }
    reject(req, id, actionDto) {
        return this.signOffService.reject(id, actionDto, req.user);
    }
    findByChangeOrder(changeOrderId) {
        return this.signOffService.findByChangeOrder(changeOrderId);
    }
};
exports.SignOffController = SignOffController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建签认请求' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sign_off_dto_1.CreateSignOffDto]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取签认列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: sign_off_enum_1.SignOffStatus }),
    (0, swagger_1.ApiQuery)({ name: 'signOffType', required: false, enum: sign_off_enum_1.SignOffType }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('signOffType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({ summary: '获取我待签认的列表' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "getPending", null);
__decorate([
    (0, common_1.Get)('my-signed'),
    (0, swagger_1.ApiOperation)({ summary: '获取我已签认的列表' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "getMySigned", null);
__decorate([
    (0, common_1.Get)('my-requested'),
    (0, swagger_1.ApiOperation)({ summary: '获取我发起的签认列表' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "getMyRequested", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取签认详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    (0, swagger_1.ApiOperation)({ summary: '签认通过' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, action_sign_off_dto_1.ActionSignOffDto]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "sign", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: '签认驳回' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, action_sign_off_dto_1.ActionSignOffDto]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('change-order/:changeOrderId'),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单的签认记录' }),
    __param(0, (0, common_1.Param)('changeOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SignOffController.prototype, "findByChangeOrder", null);
exports.SignOffController = SignOffController = __decorate([
    (0, swagger_1.ApiTags)('签认管理'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('sign-offs'),
    __metadata("design:paramtypes", [sign_off_service_1.SignOffService])
], SignOffController);
//# sourceMappingURL=sign-off.controller.js.map