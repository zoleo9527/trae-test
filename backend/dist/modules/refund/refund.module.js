"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const refund_entity_1 = require("./refund.entity");
const refund_service_1 = require("./refund.service");
const refund_controller_1 = require("./refund.controller");
const work_order_module_1 = require("../work-order/work-order.module");
let RefundModule = class RefundModule {
};
exports.RefundModule = RefundModule;
exports.RefundModule = RefundModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([refund_entity_1.Refund]), work_order_module_1.WorkOrderModule],
        controllers: [refund_controller_1.RefundController],
        providers: [refund_service_1.RefundService],
        exports: [refund_service_1.RefundService],
    })
], RefundModule);
//# sourceMappingURL=refund.module.js.map