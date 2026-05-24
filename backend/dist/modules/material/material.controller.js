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
exports.MaterialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const material_service_1 = require("./material.service");
const create_material_dto_1 = require("./dto/create-material.dto");
const update_material_status_dto_1 = require("./dto/update-material-status.dto");
const upload_version_dto_1 = require("./dto/upload-version.dto");
const query_material_dto_1 = require("./dto/query-material.dto");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
let MaterialController = class MaterialController {
    constructor(materialService) {
        this.materialService = materialService;
    }
    create(createDto) {
        const data = { ...createDto };
        if (createDto.deadline) {
            data.deadline = new Date(createDto.deadline);
        }
        return this.materialService.create(data, createDto.operatorId, createDto.operatorName);
    }
    findAll(query) {
        return this.materialService.findAll(query.page, query.limit, {
            status: query.status,
            workOrderId: query.workOrderId,
            ownerId: query.ownerId,
            type: query.type,
        });
    }
    checkDeadlines() {
        return this.materialService.checkDeadlines();
    }
    findOne(id) {
        return this.materialService.findOne(id);
    }
    getVersions(id) {
        return this.materialService.getVersions(id);
    }
    updateStatus(id, updateDto) {
        return this.materialService.updateStatus(id, updateDto.status, updateDto.operatorId, updateDto.operatorName);
    }
    uploadVersion(id, dto) {
        return this.materialService.uploadNewVersion(id, dto.fileUrl, dto.changeLog, dto.operatorId, dto.operatorName);
    }
};
exports.MaterialController = MaterialController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建材料' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_material_dto_1.CreateMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取材料列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_material_dto_1.QueryMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('deadlines/check'),
    (0, swagger_1.ApiOperation)({ summary: '检查即将到期的材料' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "checkDeadlines", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取材料详情' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, swagger_1.ApiOperation)({ summary: '获取材料版本历史' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新材料状态' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_material_status_dto_1.UpdateMaterialStatusDto]),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    (0, swagger_1.ApiOperation)({ summary: '上传新版本' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_version_dto_1.UploadVersionDto]),
    __metadata("design:returntype", void 0)
], MaterialController.prototype, "uploadVersion", null);
exports.MaterialController = MaterialController = __decorate([
    (0, swagger_1.ApiTags)('materials'),
    (0, common_1.Controller)('materials'),
    (0, common_1.UseFilters)(http_exception_filter_1.BusinessExceptionFilter),
    __metadata("design:paramtypes", [material_service_1.MaterialService])
], MaterialController);
//# sourceMappingURL=material.controller.js.map