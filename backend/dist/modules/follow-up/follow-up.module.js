"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const follow_up_service_1 = require("./follow-up.service");
const follow_up_controller_1 = require("./follow-up.controller");
const entities_1 = require("../../database/entities");
const audit_1 = require("../../common/audit");
let FollowUpModule = class FollowUpModule {
};
exports.FollowUpModule = FollowUpModule;
exports.FollowUpModule = FollowUpModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.FollowUp, entities_1.WorkOrder, entities_1.Member, entities_1.AuditLog]),
        ],
        controllers: [follow_up_controller_1.FollowUpController],
        providers: [follow_up_service_1.FollowUpService, audit_1.AuditService],
        exports: [follow_up_service_1.FollowUpService],
    })
], FollowUpModule);
//# sourceMappingURL=follow-up.module.js.map