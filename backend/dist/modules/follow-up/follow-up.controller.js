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
exports.FollowUpController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const follow_up_service_1 = require("./follow-up.service");
const auth_1 = require("../../common/auth");
const entities_1 = require("../../database/entities");
let FollowUpController = class FollowUpController {
    constructor(followUpService) {
        this.followUpService = followUpService;
    }
    create(dto, user) {
        return this.followUpService.create(dto, user);
    }
    findAll(status, type, memberId, assignedTo, page = 1, limit = 20) {
        return this.followUpService.findAll({ status, type, memberId, assignedTo }, Number(page), Number(limit));
    }
    getStats() {
        return this.followUpService.getPendingStats();
    }
    findOne(id) {
        return this.followUpService.findOne(id);
    }
    complete(id, dto, user) {
        return this.followUpService.complete(id, dto, user);
    }
};
exports.FollowUpController = FollowUpController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, entities_1.User]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('memberId')),
    __param(3, (0, common_1.Query)('assignedTo')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/complete'),
    (0, auth_1.Roles)(entities_1.UserRole.CUSTOMER_SERVICE, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, entities_1.User]),
    __metadata("design:returntype", void 0)
], FollowUpController.prototype, "complete", null);
exports.FollowUpController = FollowUpController = __decorate([
    (0, common_1.Controller)('follow-ups'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [follow_up_service_1.FollowUpService])
], FollowUpController);
//# sourceMappingURL=follow-up.controller.js.map