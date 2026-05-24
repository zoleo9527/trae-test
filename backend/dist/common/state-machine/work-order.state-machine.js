"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderStateMachine = void 0;
const common_1 = require("@nestjs/common");
const entities_1 = require("../../database/entities");
let WorkOrderStateMachine = class WorkOrderStateMachine {
    constructor() {
        this.transitions = [
            {
                from: entities_1.WorkOrderStatus.DRAFT,
                to: entities_1.WorkOrderStatus.PENDING_REVIEW,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'submit',
                description: '提交审核',
            },
            {
                from: entities_1.WorkOrderStatus.DRAFT,
                to: entities_1.WorkOrderStatus.CANCELLED,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'cancel',
                description: '取消工单',
            },
            {
                from: entities_1.WorkOrderStatus.PENDING_REVIEW,
                to: entities_1.WorkOrderStatus.REVIEWED,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'approve',
                description: '审核通过',
            },
            {
                from: entities_1.WorkOrderStatus.PENDING_REVIEW,
                to: entities_1.WorkOrderStatus.REJECTED,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'reject',
                description: '审核驳回',
            },
            {
                from: entities_1.WorkOrderStatus.REJECTED,
                to: entities_1.WorkOrderStatus.DRAFT,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'revise',
                description: '修改后重新提交',
            },
            {
                from: entities_1.WorkOrderStatus.REJECTED,
                to: entities_1.WorkOrderStatus.CANCELLED,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'cancel',
                description: '取消工单',
            },
            {
                from: entities_1.WorkOrderStatus.REVIEWED,
                to: entities_1.WorkOrderStatus.IN_PROGRESS,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'start',
                description: '开始处理',
            },
            {
                from: entities_1.WorkOrderStatus.REVIEWED,
                to: entities_1.WorkOrderStatus.NEEDS_REVIEW,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'request_review',
                description: '需要复核',
            },
            {
                from: entities_1.WorkOrderStatus.IN_PROGRESS,
                to: entities_1.WorkOrderStatus.PENDING_CONFIRM,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'complete_process',
                description: '处理完成待确认',
            },
            {
                from: entities_1.WorkOrderStatus.IN_PROGRESS,
                to: entities_1.WorkOrderStatus.NEEDS_REVIEW,
                allowedRoles: [entities_1.UserRole.WORKSHOP, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'request_review',
                description: '需要复核',
            },
            {
                from: entities_1.WorkOrderStatus.NEEDS_REVIEW,
                to: entities_1.WorkOrderStatus.IN_PROGRESS,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'resume',
                description: '复核通过继续处理',
            },
            {
                from: entities_1.WorkOrderStatus.NEEDS_REVIEW,
                to: entities_1.WorkOrderStatus.REJECTED,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'reject',
                description: '复核不通过',
            },
            {
                from: entities_1.WorkOrderStatus.PENDING_CONFIRM,
                to: entities_1.WorkOrderStatus.COMPLETED,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN, entities_1.UserRole.CUSTOMER_SERVICE],
                action: 'confirm',
                description: '确认完成',
            },
            {
                from: entities_1.WorkOrderStatus.PENDING_CONFIRM,
                to: entities_1.WorkOrderStatus.IN_PROGRESS,
                allowedRoles: [entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'rework',
                description: '返工',
            },
            {
                from: entities_1.WorkOrderStatus.PENDING_CONFIRM,
                to: entities_1.WorkOrderStatus.NEEDS_REVIEW,
                allowedRoles: [entities_1.UserRole.SALES, entities_1.UserRole.MANAGER, entities_1.UserRole.ADMIN],
                action: 'request_review',
                description: '需要复核',
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
    getTransition(currentStatus, targetStatus) {
        return this.transitions.find((t) => t.from === currentStatus && t.to === targetStatus);
    }
    validateTransition(currentStatus, targetStatus, userRole) {
        const transition = this.getTransition(currentStatus, targetStatus);
        if (!transition) {
            throw new common_1.BadRequestException(`不允许从 ${currentStatus} 状态变更为 ${targetStatus}`);
        }
        if (!transition.allowedRoles.includes(userRole)) {
            throw new common_1.BadRequestException(`当前角色 ${userRole} 没有权限执行此状态变更`);
        }
    }
    isFinalStatus(status) {
        return [
            entities_1.WorkOrderStatus.COMPLETED,
            entities_1.WorkOrderStatus.CANCELLED,
        ].includes(status);
    }
};
exports.WorkOrderStateMachine = WorkOrderStateMachine;
exports.WorkOrderStateMachine = WorkOrderStateMachine = __decorate([
    (0, common_1.Injectable)()
], WorkOrderStateMachine);
//# sourceMappingURL=work-order.state-machine.js.map