"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepairStateMachine = void 0;
const common_1 = require("@nestjs/common");
const entities_1 = require("../../database/entities");
let RepairStateMachine = class RepairStateMachine {
    constructor() {
        this.transitions = [
            {
                from: entities_1.RepairStatus.PENDING,
                to: entities_1.RepairStatus.IN_PROGRESS,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'start',
                description: '开始维修',
            },
            {
                from: entities_1.RepairStatus.PENDING,
                to: entities_1.RepairStatus.NEEDS_QUOTATION,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'request_quotation',
                description: '需要报价',
            },
            {
                from: entities_1.RepairStatus.PENDING,
                to: entities_1.RepairStatus.CANCELLED,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'cancel',
                description: '取消维修',
            },
            {
                from: entities_1.RepairStatus.IN_PROGRESS,
                to: entities_1.RepairStatus.NEEDS_QUOTATION,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'request_quotation',
                description: '需要追加报价',
            },
            {
                from: entities_1.RepairStatus.IN_PROGRESS,
                to: entities_1.RepairStatus.COMPLETED,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'complete',
                description: '维修完成',
            },
            {
                from: entities_1.RepairStatus.NEEDS_QUOTATION,
                to: entities_1.RepairStatus.QUOTATION_APPROVED,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'approve_quotation',
                description: '报价已确认',
            },
            {
                from: entities_1.RepairStatus.NEEDS_QUOTATION,
                to: entities_1.RepairStatus.QUOTATION_REJECTED,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'reject_quotation',
                description: '报价未通过',
            },
            {
                from: entities_1.RepairStatus.QUOTATION_APPROVED,
                to: entities_1.RepairStatus.IN_PROGRESS,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'resume',
                description: '继续维修',
            },
            {
                from: entities_1.RepairStatus.QUOTATION_REJECTED,
                to: entities_1.RepairStatus.CANCELLED,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'cancel',
                description: '取消维修',
            },
            {
                from: entities_1.RepairStatus.QUOTATION_REJECTED,
                to: entities_1.RepairStatus.NEEDS_QUOTATION,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 're_quote',
                description: '重新报价',
            },
        ];
    }
    canTransition(currentStatus, targetStatus, userRole) {
        const transition = this.transitions.find((t) => t.from === currentStatus && t.to === targetStatus);
        if (!transition)
            return false;
        return transition.allowedRoles.includes(userRole);
    }
    getAvailableTransitions(currentStatus, userRole) {
        return this.transitions.filter((t) => t.from === currentStatus && t.allowedRoles.includes(userRole));
    }
    validateTransition(currentStatus, targetStatus, userRole) {
        const transition = this.transitions.find((t) => t.from === currentStatus && t.to === targetStatus);
        if (!transition) {
            throw new common_1.BadRequestException(`不允许从 ${currentStatus} 状态变更为 ${targetStatus}`);
        }
        if (!transition.allowedRoles.includes(userRole)) {
            throw new common_1.BadRequestException(`当前角色 ${userRole} 没有权限执行此状态变更`);
        }
    }
    isFinalStatus(status) {
        return [
            entities_1.RepairStatus.COMPLETED,
            entities_1.RepairStatus.CANCELLED,
            entities_1.RepairStatus.QUOTATION_REJECTED,
        ].includes(status);
    }
};
exports.RepairStateMachine = RepairStateMachine;
exports.RepairStateMachine = RepairStateMachine = __decorate([
    (0, common_1.Injectable)()
], RepairStateMachine);
//# sourceMappingURL=repair.state-machine.js.map