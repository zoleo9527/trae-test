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
exports.TransferController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transfer_service_1 = require("./transfer.service");
const create_transfer_dto_1 = require("./dto/create-transfer.dto");
const update_transfer_status_dto_1 = require("./dto/update-transfer-status.dto");
const query_transfer_dto_1 = require("./dto/query-transfer.dto");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
let TransferController = class TransferController {
    constructor(transferService) {
        this.transferService = transferService;
    }
    create(createDto) {
        return this.transferService.create(createDto, createDto.operatorId, createDto.operatorName);
    }
    findAll(query) {
        return this.transferService.findAll(query.page, query.limit, {
            status: query.status,
            workOrderId: query.workOrderId,
            fromConsultantId: query.fromConsultantId,
            toConsultantId: query.toConsultantId,
        });
    }
    findOne(id) {
        return this.transferService.findOne(id);
    }
    updateStatus(id, updateDto) {
        return this.transferService.updateStatus(id, updateDto.status, updateDto.operatorId, updateDto.operatorName, {
            rejectionReason: updateDto.rejectionReason,
        });
    }
    updateHandover(id, data) {
        return this.transferService.updateHandoverContent(id, data, data['operatorId'], data['operatorName'] || 'System');
    }
};
exports.TransferController = TransferController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建顾问交接' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transfer_dto_1.CreateTransferDto]),
    __metadata("design:returntype", void 0)
], TransferController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取交接列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_transfer_dto_1.QueryTransferDto]),
    __metadata("design:returntype", void 0)
], TransferController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取交接详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransferController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新交接状态' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transfer_status_dto_1.UpdateTransferStatusDto]),
    __metadata("design:returntype", void 0)
], TransferController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/handover'),
    (0, swagger_1.ApiOperation)({ summary: '更新交接内容' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransferController.prototype, "updateHandover", null);
exports.TransferController = TransferController = __decorate([
    (0, swagger_1.ApiTags)('transfers'),
    (0, common_1.Controller)('transfers'),
    (0, common_1.UseFilters)(http_exception_filter_1.BusinessExceptionFilter),
    __metadata("design:paramtypes", [transfer_service_1.TransferService])
], TransferController);
//# sourceMappingURL=transfer.controller.js.map