"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const work_order_controller_1 = require("./work-order.controller");
const work_order_service_1 = require("./work-order.service");
const work_order_entity_1 = require("../../entities/work-order.entity");
const status_history_entity_1 = require("../../entities/status-history.entity");
const user_entity_1 = require("../../entities/user.entity");
const downtime_record_entity_1 = require("../../entities/downtime-record.entity");
const spare_part_entity_1 = require("../../entities/spare-part.entity");
const part_usage_entity_1 = require("../../entities/part-usage.entity");
const review_record_entity_1 = require("../../entities/review-record.entity");
let WorkOrderModule = class WorkOrderModule {
};
exports.WorkOrderModule = WorkOrderModule;
exports.WorkOrderModule = WorkOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([work_order_entity_1.WorkOrder, status_history_entity_1.StatusHistory, user_entity_1.User, downtime_record_entity_1.DowntimeRecord, spare_part_entity_1.SparePart, part_usage_entity_1.PartUsage, review_record_entity_1.ReviewRecord])],
        controllers: [work_order_controller_1.WorkOrderController],
        providers: [work_order_service_1.WorkOrderService],
        exports: [work_order_service_1.WorkOrderService],
    })
], WorkOrderModule);
//# sourceMappingURL=work-order.module.js.map