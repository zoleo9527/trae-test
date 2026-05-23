"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DowntimeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const downtime_controller_1 = require("./downtime.controller");
const downtime_service_1 = require("./downtime.service");
const downtime_record_entity_1 = require("../../entities/downtime-record.entity");
const work_order_entity_1 = require("../../entities/work-order.entity");
let DowntimeModule = class DowntimeModule {
};
exports.DowntimeModule = DowntimeModule;
exports.DowntimeModule = DowntimeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([downtime_record_entity_1.DowntimeRecord, work_order_entity_1.WorkOrder])],
        controllers: [downtime_controller_1.DowntimeController],
        providers: [downtime_service_1.DowntimeService],
        exports: [downtime_service_1.DowntimeService],
    })
], DowntimeModule);
//# sourceMappingURL=downtime.module.js.map