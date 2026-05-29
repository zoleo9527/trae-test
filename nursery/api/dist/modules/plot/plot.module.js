"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlotModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const plot_controller_1 = require("./plot.controller");
const plot_entity_1 = require("./plot.entity");
const plot_service_1 = require("./plot.service");
let PlotModule = class PlotModule {
};
exports.PlotModule = PlotModule;
exports.PlotModule = PlotModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([plot_entity_1.Plot])],
        providers: [plot_service_1.PlotService],
        controllers: [plot_controller_1.PlotController],
        exports: [plot_service_1.PlotService],
    })
], PlotModule);
//# sourceMappingURL=plot.module.js.map