"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SparePartModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const spare_part_controller_1 = require("./spare-part.controller");
const spare_part_service_1 = require("./spare-part.service");
const spare_part_entity_1 = require("../../entities/spare-part.entity");
const part_usage_entity_1 = require("../../entities/part-usage.entity");
const work_order_entity_1 = require("../../entities/work-order.entity");
let SparePartModule = class SparePartModule {
};
exports.SparePartModule = SparePartModule;
exports.SparePartModule = SparePartModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([spare_part_entity_1.SparePart, part_usage_entity_1.PartUsage, work_order_entity_1.WorkOrder])],
        controllers: [spare_part_controller_1.SparePartController, spare_part_controller_1.PartUsageController],
        providers: [spare_part_service_1.SparePartService],
        exports: [spare_part_service_1.SparePartService],
    })
], SparePartModule);
//# sourceMappingURL=spare-part.module.js.map