"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const repair_service_1 = require("./repair.service");
const repair_controller_1 = require("./repair.controller");
const entities_1 = require("../../database/entities");
const state_machine_1 = require("../../common/state-machine");
const audit_1 = require("../../common/audit");
let RepairModule = class RepairModule {
};
exports.RepairModule = RepairModule;
exports.RepairModule = RepairModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.Repair, entities_1.RepairStep, entities_1.WorkOrder, entities_1.AuditLog]),
        ],
        controllers: [repair_controller_1.RepairController],
        providers: [repair_service_1.RepairService, state_machine_1.RepairStateMachine, audit_1.AuditService],
        exports: [repair_service_1.RepairService],
    })
], RepairModule);
//# sourceMappingURL=repair.module.js.map