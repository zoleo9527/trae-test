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
const work_order_service_1 = require("./work-order.service");
const work_order_controller_1 = require("./work-order.controller");
const entities_1 = require("../../database/entities");
const state_machine_1 = require("../../common/state-machine");
const audit_1 = require("../../common/audit");
const follow_up_module_1 = require("../follow-up/follow-up.module");
let WorkOrderModule = class WorkOrderModule {
};
exports.WorkOrderModule = WorkOrderModule;
exports.WorkOrderModule = WorkOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.WorkOrder, entities_1.WorkOrderItem, entities_1.StatusHistory, entities_1.Member, entities_1.AuditLog]),
            (0, common_1.forwardRef)(() => follow_up_module_1.FollowUpModule),
        ],
        controllers: [work_order_controller_1.WorkOrderController],
        providers: [work_order_service_1.WorkOrderService, state_machine_1.WorkOrderStateMachine, audit_1.AuditService],
        exports: [work_order_service_1.WorkOrderService],
    })
], WorkOrderModule);
//# sourceMappingURL=work-order.module.js.map