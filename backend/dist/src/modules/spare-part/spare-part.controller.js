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
exports.PartUsageController = exports.SparePartController = void 0;
const common_1 = require("@nestjs/common");
const spare_part_service_1 = require("./spare-part.service");
const spare_part_dto_1 = require("./dto/spare-part.dto");
let SparePartController = class SparePartController {
    constructor(sparePartService) {
        this.sparePartService = sparePartService;
    }
    async createPart(createDto) {
        return this.sparePartService.createPart(createDto);
    }
    async findAllParts(queryDto) {
        return this.sparePartService.findAllParts(queryDto);
    }
    async findOnePart(id) {
        return this.sparePartService.findOnePart(id);
    }
    async updatePart(id, updateDto) {
        return this.sparePartService.updatePart(id, updateDto);
    }
    async deletePart(id) {
        return this.sparePartService.deletePart(id);
    }
};
exports.SparePartController = SparePartController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [spare_part_dto_1.CreateSparePartDto]),
    __metadata("design:returntype", Promise)
], SparePartController.prototype, "createPart", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [spare_part_dto_1.QuerySparePartDto]),
    __metadata("design:returntype", Promise)
], SparePartController.prototype, "findAllParts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SparePartController.prototype, "findOnePart", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, spare_part_dto_1.UpdateSparePartDto]),
    __metadata("design:returntype", Promise)
], SparePartController.prototype, "updatePart", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SparePartController.prototype, "deletePart", null);
exports.SparePartController = SparePartController = __decorate([
    (0, common_1.Controller)('api/spare-parts'),
    __metadata("design:paramtypes", [spare_part_service_1.SparePartService])
], SparePartController);
let PartUsageController = class PartUsageController {
    constructor(sparePartService) {
        this.sparePartService = sparePartService;
    }
    async requestPart(createDto) {
        return this.sparePartService.requestPart(createDto);
    }
    async findAllUsages(queryDto) {
        return this.sparePartService.findAllUsages(queryDto);
    }
    async findOneUsage(id) {
        return this.sparePartService.findOneUsage(id);
    }
    async approve(id, approveDto) {
        return this.sparePartService.approvePartUsage(id, approveDto);
    }
    async receive(id, receiveDto) {
        return this.sparePartService.receivePartUsage(id, receiveDto);
    }
};
exports.PartUsageController = PartUsageController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [spare_part_dto_1.CreatePartUsageDto]),
    __metadata("design:returntype", Promise)
], PartUsageController.prototype, "requestPart", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [spare_part_dto_1.QueryPartUsageDto]),
    __metadata("design:returntype", Promise)
], PartUsageController.prototype, "findAllUsages", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PartUsageController.prototype, "findOneUsage", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, spare_part_dto_1.ApprovePartUsageDto]),
    __metadata("design:returntype", Promise)
], PartUsageController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, spare_part_dto_1.ReceivePartUsageDto]),
    __metadata("design:returntype", Promise)
], PartUsageController.prototype, "receive", null);
exports.PartUsageController = PartUsageController = __decorate([
    (0, common_1.Controller)('api/part-usages'),
    __metadata("design:paramtypes", [spare_part_service_1.SparePartService])
], PartUsageController);
//# sourceMappingURL=spare-part.controller.js.map