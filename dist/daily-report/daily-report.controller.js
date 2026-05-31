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
exports.DailyReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const daily_report_service_1 = require("./daily-report.service");
const create_daily_report_dto_1 = require("./dto/create-daily-report.dto");
const update_daily_report_dto_1 = require("./dto/update-daily-report.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let DailyReportController = class DailyReportController {
    constructor(dailyReportService) {
        this.dailyReportService = dailyReportService;
    }
    create(req, createDailyReportDto) {
        return this.dailyReportService.create(createDailyReportDto, req.user);
    }
    findAll(page = 1, limit = 20, projectId, startDate, endDate) {
        return this.dailyReportService.findAll(page, limit, { projectId, startDate, endDate });
    }
    findOne(id) {
        return this.dailyReportService.findOne(id);
    }
    update(req, id, updateDailyReportDto) {
        return this.dailyReportService.update(id, updateDailyReportDto, req.user);
    }
    findByChangeOrder(changeOrderId) {
        return this.dailyReportService.findByChangeOrder(changeOrderId);
    }
};
exports.DailyReportController = DailyReportController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建施工日报' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_daily_report_dto_1.CreateDailyReportDto]),
    __metadata("design:returntype", void 0)
], DailyReportController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取施工日报列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('projectId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], DailyReportController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取施工日报详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DailyReportController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新施工日报' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_daily_report_dto_1.UpdateDailyReportDto]),
    __metadata("design:returntype", void 0)
], DailyReportController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('change-order/:changeOrderId'),
    (0, swagger_1.ApiOperation)({ summary: '获取变更单关联的施工日报' }),
    __param(0, (0, common_1.Param)('changeOrderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DailyReportController.prototype, "findByChangeOrder", null);
exports.DailyReportController = DailyReportController = __decorate([
    (0, swagger_1.ApiTags)('施工日报'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('daily-reports'),
    __metadata("design:paramtypes", [daily_report_service_1.DailyReportService])
], DailyReportController);
//# sourceMappingURL=daily-report.controller.js.map