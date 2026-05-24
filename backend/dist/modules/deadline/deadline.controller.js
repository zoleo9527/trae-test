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
exports.DeadlineController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deadline_service_1 = require("./deadline.service");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
let DeadlineController = class DeadlineController {
    constructor(deadlineService) {
        this.deadlineService = deadlineService;
    }
    create(data) {
        return this.deadlineService.create(data, data.operatorId, data.operatorName || 'System');
    }
    findByWorkOrder(workOrderId) {
        return this.deadlineService.findByWorkOrder(workOrderId);
    }
    findUpcoming(days = 7) {
        return this.deadlineService.findUpcoming(days);
    }
    checkOverdue() {
        return this.deadlineService.checkOverdue();
    }
    markComplete(id, data) {
        return this.deadlineService.markComplete(id, data.operatorId, data.operatorName || 'System');
    }
};
exports.DeadlineController = DeadlineController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建截止日提醒' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeadlineController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('work-order/:workOrderId'),
    (0, swagger_1.ApiOperation)({ summary: '获取工单的截止日列表' }),
    __param(0, (0, common_1.Param)('workOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DeadlineController.prototype, "findByWorkOrder", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, swagger_1.ApiOperation)({ summary: '获取即将到期的截止日' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeadlineController.prototype, "findUpcoming", null);
__decorate([
    (0, common_1.Get)('overdue/check'),
    (0, swagger_1.ApiOperation)({ summary: '检查逾期截止日' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DeadlineController.prototype, "checkOverdue", null);
__decorate([
    (0, common_1.Put)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: '标记截止日任务完成' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DeadlineController.prototype, "markComplete", null);
exports.DeadlineController = DeadlineController = __decorate([
    (0, swagger_1.ApiTags)('deadlines'),
    (0, common_1.Controller)('deadlines'),
    (0, common_1.UseFilters)(http_exception_filter_1.BusinessExceptionFilter),
    __metadata("design:paramtypes", [deadline_service_1.DeadlineService])
], DeadlineController);
//# sourceMappingURL=deadline.controller.js.map