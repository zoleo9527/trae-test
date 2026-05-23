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
const work_order_service_1 = require("./work-order.service");
const work_order_dto_1 = require("./dto/work-order.dto");
const workflow_dto_1 = require("./dto/workflow.dto");
let WorkOrderController = class WorkOrderController {
    constructor(workOrderService) {
        this.workOrderService = workOrderService;
    }
    async create(createDto) {
        return this.workOrderService.create(createDto);
    }
    async findAll(queryDto) {
        return this.workOrderService.findAll(queryDto);
    }
    async getStatistics() {
        return this.workOrderService.getStatistics();
    }
    async export(queryDto) {
        const filePath = await this.workOrderService.exportToCsv(queryDto);
        return { filePath };
    }
    async findOne(id) {
        return this.workOrderService.findOne(id);
    }
    async update(id, updateDto) {
        return this.workOrderService.update(id, updateDto);
    }
    async assignHandler(id, assignDto) {
        return this.workOrderService.assignHandler(id, assignDto);
    }
    async transitionStatus(id, transitionDto) {
        return this.workOrderService.transitionStatus(id, transitionDto);
    }
    async confirmDowntime(id, dto) {
        return this.workOrderService.confirmDowntime(id, dto);
    }
    async requestPart(id, dto) {
        return this.workOrderService.requestPart(id, dto);
    }
    async approvePart(id, dto) {
        return this.workOrderService.approvePart(id, dto);
    }
    async receivePart(id, dto) {
        return this.workOrderService.receivePart(id, dto);
    }
    async completeRepair(id, dto) {
        return this.workOrderService.completeRepair(id, dto);
    }
    async submitReview(id, dto) {
        return this.workOrderService.submitReview(id, dto);
    }
    async verifyReview(id, dto) {
        return this.workOrderService.verifyReview(id, dto);
    }
    async delete(id) {
        return this.workOrderService.delete(id);
    }
};
exports.WorkOrderController = WorkOrderController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [work_order_dto_1.CreateWorkOrderDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [work_order_dto_1.QueryWorkOrderDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [work_order_dto_1.QueryWorkOrderDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "export", null);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, work_order_dto_1.UpdateWorkOrderDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/assign-handler'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, work_order_dto_1.AssignHandlerDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "assignHandler", null);
__decorate([
    (0, common_1.Post)(':id/transition'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, work_order_dto_1.TransitionStatusDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "transitionStatus", null);
__decorate([
    (0, common_1.Post)(':id/confirm-downtime'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.ConfirmDowntimeDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "confirmDowntime", null);
__decorate([
    (0, common_1.Post)(':id/request-part'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.RequestPartDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "requestPart", null);
__decorate([
    (0, common_1.Post)(':id/approve-part'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.ApprovePartDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "approvePart", null);
__decorate([
    (0, common_1.Post)(':id/receive-part'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.ReceivePartDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "receivePart", null);
__decorate([
    (0, common_1.Post)(':id/complete-repair'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.CompleteRepairDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "completeRepair", null);
__decorate([
    (0, common_1.Post)(':id/submit-review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.SubmitReviewDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Post)(':id/verify-review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.VerifyReviewDto]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "verifyReview", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkOrderController.prototype, "delete", null);
exports.WorkOrderController = WorkOrderController = __decorate([
    (0, common_1.Controller)('api/work-orders'),
    __metadata("design:paramtypes", [work_order_service_1.WorkOrderService])
], WorkOrderController);
//# sourceMappingURL=work-order.controller.js.map