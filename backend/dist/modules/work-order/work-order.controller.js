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
const swagger_1 = require("@nestjs/swagger");
const work_order_service_1 = require("./work-order.service");
const create_work_order_dto_1 = require("./dto/create-work-order.dto");
const update_work_order_status_dto_1 = require("./dto/update-work-order-status.dto");
const query_work_order_dto_1 = require("./dto/query-work-order.dto");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
let WorkOrderController = class WorkOrderController {
    constructor(workOrderService) {
        this.workOrderService = workOrderService;
    }
    create(createDto) {
        const data = { ...createDto };
        if (createDto.expectedDeadline) {
            data.expectedDeadline = new Date(createDto.expectedDeadline);
        }
        return this.workOrderService.create(data, createDto.operatorId, createDto.operatorName);
    }
    findAll(query) {
        return this.workOrderService.findAll(query.page, query.limit, {
            status: query.status,
            studentId: query.studentId,
            currentConsultantId: query.currentConsultantId,
        });
    }
    getOverview(consultantId) {
        return this.workOrderService.getOverview(consultantId);
    }
    findOne(id) {
        return this.workOrderService.findOne(id);
    }
    updateStatus(id, updateDto) {
        return this.workOrderService.updateStatus(id, updateDto.status, updateDto.operatorId, updateDto.operatorName, updateDto.remark);
    }
};
exports.WorkOrderController = WorkOrderController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建工单' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_work_order_dto_1.CreateWorkOrderDto]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取工单列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_work_order_dto_1.QueryWorkOrderDto]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: '获取工单概览统计' }),
    __param(0, (0, common_1.Query)('consultantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取工单详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新工单状态' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_work_order_status_dto_1.UpdateWorkOrderStatusDto]),
    __metadata("design:returntype", void 0)
], WorkOrderController.prototype, "updateStatus", null);
exports.WorkOrderController = WorkOrderController = __decorate([
    (0, swagger_1.ApiTags)('work-orders'),
    (0, common_1.Controller)('work-orders'),
    (0, common_1.UseFilters)(http_exception_filter_1.BusinessExceptionFilter),
    __metadata("design:paramtypes", [work_order_service_1.WorkOrderService])
], WorkOrderController);
//# sourceMappingURL=work-order.controller.js.map