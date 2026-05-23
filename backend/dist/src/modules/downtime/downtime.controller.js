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
exports.DowntimeController = void 0;
const common_1 = require("@nestjs/common");
const downtime_service_1 = require("./downtime.service");
const downtime_dto_1 = require("./dto/downtime.dto");
let DowntimeController = class DowntimeController {
    constructor(downtimeService) {
        this.downtimeService = downtimeService;
    }
    async create(createDto) {
        return this.downtimeService.create(createDto);
    }
    async findAll(queryDto) {
        return this.downtimeService.findAll(queryDto);
    }
    async findOne(id) {
        return this.downtimeService.findOne(id);
    }
    async update(id, updateDto) {
        return this.downtimeService.update(id, updateDto);
    }
    async confirm(id, confirmDto) {
        return this.downtimeService.confirm(id, confirmDto);
    }
    async delete(id) {
        return this.downtimeService.delete(id);
    }
};
exports.DowntimeController = DowntimeController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [downtime_dto_1.CreateDowntimeDto]),
    __metadata("design:returntype", Promise)
], DowntimeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [downtime_dto_1.QueryDowntimeDto]),
    __metadata("design:returntype", Promise)
], DowntimeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DowntimeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, downtime_dto_1.UpdateDowntimeDto]),
    __metadata("design:returntype", Promise)
], DowntimeController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, downtime_dto_1.ConfirmDowntimeDto]),
    __metadata("design:returntype", Promise)
], DowntimeController.prototype, "confirm", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DowntimeController.prototype, "delete", null);
exports.DowntimeController = DowntimeController = __decorate([
    (0, common_1.Controller)('api/downtime'),
    __metadata("design:paramtypes", [downtime_service_1.DowntimeService])
], DowntimeController);
//# sourceMappingURL=downtime.controller.js.map