"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignOffModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sign_off_service_1 = require("./sign-off.service");
const sign_off_controller_1 = require("./sign-off.controller");
const sign_off_entity_1 = require("./entities/sign-off.entity");
const change_order_entity_1 = require("../change-order/entities/change-order.entity");
const audit_module_1 = require("../audit/audit.module");
let SignOffModule = class SignOffModule {
};
exports.SignOffModule = SignOffModule;
exports.SignOffModule = SignOffModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([sign_off_entity_1.SignOff, change_order_entity_1.ChangeOrder]),
            audit_module_1.AuditModule,
        ],
        controllers: [sign_off_controller_1.SignOffController],
        providers: [sign_off_service_1.SignOffService],
        exports: [sign_off_service_1.SignOffService],
    })
], SignOffModule);
//# sourceMappingURL=sign-off.module.js.map