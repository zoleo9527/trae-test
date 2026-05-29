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
exports.PlotController = void 0;
const common_1 = require("@nestjs/common");
const plot_dto_1 = require("./dto/plot.dto");
const plot_service_1 = require("./plot.service");
let PlotController = class PlotController {
    constructor(plotService) {
        this.plotService = plotService;
    }
    async findAll(query) {
        return this.plotService.findAll(query);
    }
    async findOne(id) {
        return this.plotService.findOne(id);
    }
    async create(dto) {
        return this.plotService.create(dto);
    }
    async update(id, dto) {
        return this.plotService.update(id, dto);
    }
};
exports.PlotController = PlotController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [plot_dto_1.QueryPlotDto]),
    __metadata("design:returntype", Promise)
], PlotController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlotController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [plot_dto_1.CreatePlotDto]),
    __metadata("design:returntype", Promise)
], PlotController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PlotController.prototype, "update", null);
exports.PlotController = PlotController = __decorate([
    (0, common_1.Controller)('api/plots'),
    __metadata("design:paramtypes", [plot_service_1.PlotService])
], PlotController);
//# sourceMappingURL=plot.controller.js.map