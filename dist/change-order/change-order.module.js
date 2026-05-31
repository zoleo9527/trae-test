"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeOrderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const change_order_service_1 = require("./change-order.service");
const change_order_controller_1 = require("./change-order.controller");
const change_order_entity_1 = require("./entities/change-order.entity");
const change_order_version_entity_1 = require("./entities/change-order-version.entity");
const sign_off_entity_1 = require("../sign-off/entities/sign-off.entity");
const audit_module_1 = require("../audit/audit.module");
let ChangeOrderModule = class ChangeOrderModule {
};
exports.ChangeOrderModule = ChangeOrderModule;
exports.ChangeOrderModule = ChangeOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([change_order_entity_1.ChangeOrder, change_order_version_entity_1.ChangeOrderVersion, sign_off_entity_1.SignOff]),
            audit_module_1.AuditModule,
        ],
        controllers: [change_order_controller_1.ChangeOrderController],
        providers: [change_order_service_1.ChangeOrderService],
        exports: [change_order_service_1.ChangeOrderService],
    })
], ChangeOrderModule);
//# sourceMappingURL=change-order.module.js.map