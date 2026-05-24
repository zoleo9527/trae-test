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
exports.RefundController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const refund_service_1 = require("./refund.service");
const create_refund_dto_1 = require("./dto/create-refund.dto");
const update_refund_status_dto_1 = require("./dto/update-refund-status.dto");
const query_refund_dto_1 = require("./dto/query-refund.dto");
const add_negotiation_dto_1 = require("./dto/add-negotiation.dto");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
let RefundController = class RefundController {
    constructor(refundService) {
        this.refundService = refundService;
    }
    create(createDto) {
        return this.refundService.create(createDto, createDto.operatorId, createDto.operatorName);
    }
    findAll(query) {
        return this.refundService.findAll(query.page, query.limit, {
            status: query.status,
            workOrderId: query.workOrderId,
            initiatorId: query.initiatorId,
        });
    }
    findOne(id) {
        return this.refundService.findOne(id);
    }
    updateStatus(id, updateDto) {
        return this.refundService.updateStatus(id, updateDto.status, updateDto.operatorId, updateDto.operatorName, {
            rejectionReason: updateDto.rejectionReason,
            approvedAmount: updateDto.approvedAmount,
            reviewerId: updateDto.reviewerId,
        });
    }
    addNegotiation(id, dto) {
        return this.refundService.addNegotiationHistory(id, dto.history, dto.operatorId, dto.operatorName);
    }
};
exports.RefundController = RefundController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建退款申请' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_refund_dto_1.CreateRefundDto]),
    __metadata("design:returntype", void 0)
], RefundController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取退款申请列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_refund_dto_1.QueryRefundDto]),
    __metadata("design:returntype", void 0)
], RefundController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取退款申请详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RefundController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新退款状态' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_refund_status_dto_1.UpdateRefundStatusDto]),
    __metadata("design:returntype", void 0)
], RefundController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/negotiations'),
    (0, swagger_1.ApiOperation)({ summary: '添加协商记录' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_negotiation_dto_1.AddNegotiationDto]),
    __metadata("design:returntype", void 0)
], RefundController.prototype, "addNegotiation", null);
exports.RefundController = RefundController = __decorate([
    (0, swagger_1.ApiTags)('refunds'),
    (0, common_1.Controller)('refunds'),
    (0, common_1.UseFilters)(http_exception_filter_1.BusinessExceptionFilter),
    __metadata("design:paramtypes", [refund_service_1.RefundService])
], RefundController);
//# sourceMappingURL=refund.controller.js.map