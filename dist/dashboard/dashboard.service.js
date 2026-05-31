"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const change_order_entity_1 = require("../change-order/entities/change-order.entity");
const sign_off_entity_1 = require("../sign-off/entities/sign-off.entity");
const change_order_status_enum_1 = require("../common/enums/change-order-status.enum");
const sign_off_enum_1 = require("../common/enums/sign-off.enum");
const role_enum_1 = require("../common/enums/role.enum");
let DashboardService = class DashboardService {
    constructor(changeOrderRepository, signOffRepository) {
        this.changeOrderRepository = changeOrderRepository;
        this.signOffRepository = signOffRepository;
    }
    async getOverview(user) {
        const [rejectedChangeOrders, totalChangeOrders] = await Promise.all([
            this.changeOrderRepository.count({
                where: {
                    status: change_order_status_enum_1.ChangeOrderStatus.REJECTED,
                },
            }),
            this.changeOrderRepository.count(),
        ]);
        const pendingChangeOrders = await this.countPendingChangeOrdersForUser(user);
        const pendingSignOffs = await this.countPendingSignOffsForUser(user);
        const needsReview = await this.countNeedsReviewForUser(user);
        return {
            pendingChangeOrders,
            rejectedChangeOrders,
            pendingSignOffs,
            needsReview,
            totalChangeOrders,
        };
    }
    async countPendingChangeOrdersForUser(user) {
        const queryBuilder = this.changeOrderRepository.createQueryBuilder('co');
        if (user.role === role_enum_1.Role.ADMIN) {
            queryBuilder.where('co.status IN (:...statuses)', {
                statuses: [
                    change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                    change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                    change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
                ],
            });
        }
        else if (user.role === role_enum_1.Role.PROJECT_MANAGER) {
            queryBuilder.where('co.status IN (:...statuses)', {
                statuses: [
                    change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                    change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                    change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
                ],
            });
        }
        else if (user.role === role_enum_1.Role.SUPERVISOR) {
            queryBuilder.where('co.status = :status', {
                status: change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
            });
        }
        else if (user.role === role_enum_1.Role.CLIENT) {
            queryBuilder.where('co.status = :status', {
                status: change_order_status_enum_1.ChangeOrderStatus.APPROVED,
            });
        }
        else {
            queryBuilder.where('co.status IN (:...statuses)', {
                statuses: [
                    change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                    change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                ],
            });
        }
        return queryBuilder.getCount();
    }
    async countPendingSignOffsForUser(user) {
        const queryBuilder = this.signOffRepository
            .createQueryBuilder('so')
            .leftJoin('so.changeOrder', 'co')
            .where('so.status = :status', { status: sign_off_enum_1.SignOffStatus.PENDING })
            .andWhere('(so.changeOrderId IS NULL OR so.processVersion = co.signOffProcessVersion)');
        if (user.role !== role_enum_1.Role.ADMIN) {
            queryBuilder.andWhere('(so.signerRole IS NULL OR so.signerRole = :userRole)', { userRole: user.role });
            queryBuilder.andWhere('(so.signerDepartment IS NULL OR so.signerDepartment = :userDepartment)', { userDepartment: user.department });
        }
        return queryBuilder.getCount();
    }
    async countNeedsReviewForUser(user) {
        const queryBuilder = this.changeOrderRepository
            .createQueryBuilder('co')
            .leftJoin('co.signOffs', 'so', 'so.processVersion = co.signOffProcessVersion')
            .where('co.status IN (:...statuses)', {
            statuses: [
                change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
            ],
        })
            .andWhere('(so.id IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' });
        if (user.role !== role_enum_1.Role.ADMIN) {
            queryBuilder.andWhere('(so.signerRole IS NULL OR so.signerRole = :userRole)', { userRole: user.role });
        }
        return queryBuilder.getCount();
    }
    async getPendingItems(user) {
        const pendingChangeOrders = await this.getPendingChangeOrdersForUser(user);
        const pendingSignOffs = await this.getPendingSignOffsForUser(user);
        return {
            changeOrders: pendingChangeOrders,
            signOffs: pendingSignOffs,
        };
    }
    async getPendingChangeOrdersForUser(user) {
        const queryBuilder = this.changeOrderRepository
            .createQueryBuilder('co')
            .leftJoinAndSelect('co.createdBy', 'createdBy');
        if (user.role === role_enum_1.Role.ADMIN) {
            queryBuilder.where('co.status IN (:...statuses)', {
                statuses: [
                    change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                    change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                    change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
                ],
            });
        }
        else if (user.role === role_enum_1.Role.PROJECT_MANAGER) {
            queryBuilder.where('co.status IN (:...statuses)', {
                statuses: [
                    change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                    change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                    change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
                ],
            });
        }
        else if (user.role === role_enum_1.Role.SUPERVISOR) {
            queryBuilder.where('co.status = :status', {
                status: change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
            });
        }
        else if (user.role === role_enum_1.Role.CLIENT) {
            queryBuilder.where('co.status = :status', {
                status: change_order_status_enum_1.ChangeOrderStatus.APPROVED,
            });
        }
        else {
            queryBuilder.where('co.status IN (:...statuses)', {
                statuses: [
                    change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                    change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                ],
            });
        }
        return queryBuilder
            .orderBy('co.createdAt', 'DESC')
            .take(10)
            .getMany();
    }
    async getPendingSignOffsForUser(user) {
        const queryBuilder = this.signOffRepository
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.requestedBy', 'requestedBy')
            .leftJoinAndSelect('so.changeOrder', 'changeOrder')
            .leftJoinAndSelect('so.dailyReport', 'dailyReport')
            .leftJoinAndSelect('so.delivery', 'delivery')
            .where('so.status = :status', { status: sign_off_enum_1.SignOffStatus.PENDING })
            .andWhere('(so.changeOrderId IS NULL OR so.processVersion = changeOrder.signOffProcessVersion)');
        if (user.role !== role_enum_1.Role.ADMIN) {
            queryBuilder.andWhere('(so.signerRole IS NULL OR so.signerRole = :userRole)', { userRole: user.role });
            queryBuilder.andWhere('(so.signerDepartment IS NULL OR so.signerDepartment = :userDepartment)', { userDepartment: user.department });
        }
        return queryBuilder
            .orderBy('so.createdAt', 'DESC')
            .take(10)
            .getMany();
    }
    async getRejectedItems(user) {
        return this.changeOrderRepository.find({
            where: {
                status: change_order_status_enum_1.ChangeOrderStatus.REJECTED,
            },
            relations: ['createdBy', 'approvedBy'],
            order: { updatedAt: 'DESC' },
            take: 10,
        });
    }
    async getNeedsReview(user) {
        const queryBuilder = this.changeOrderRepository
            .createQueryBuilder('co')
            .leftJoinAndSelect('co.createdBy', 'createdBy')
            .leftJoin('co.signOffs', 'so', 'so.processVersion = co.signOffProcessVersion')
            .where('co.status IN (:...statuses)', {
            statuses: [
                change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
            ],
        })
            .andWhere('(so.id IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' });
        if (user.role !== role_enum_1.Role.ADMIN) {
            queryBuilder.andWhere('(so.signerRole IS NULL OR so.signerRole = :userRole)', { userRole: user.role });
        }
        return queryBuilder
            .orderBy('co.createdAt', 'DESC')
            .take(10)
            .getMany();
    }
    async getStatusStatistics() {
        const result = await this.changeOrderRepository
            .createQueryBuilder('co')
            .select('co.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('co.status')
            .getRawMany();
        const statistics = {};
        for (const status of Object.values(change_order_status_enum_1.ChangeOrderStatus)) {
            statistics[status] = 0;
        }
        for (const row of result) {
            statistics[row.status] = parseInt(row.count, 10);
        }
        return statistics;
    }
    async getRecentActivity(user) {
        const recentChangeOrders = await this.changeOrderRepository.find({
            relations: ['createdBy'],
            order: { updatedAt: 'DESC' },
            take: 5,
        });
        const recentSignOffs = await this.signOffRepository.find({
            where: { status: sign_off_enum_1.SignOffStatus.SIGNED },
            relations: ['signedBy', 'changeOrder'],
            order: { signedAt: 'DESC' },
            take: 5,
        });
        return {
            recentChangeOrders,
            recentSignOffs,
        };
    }
    async getMyTasks(user) {
        const myPendingSignOffs = await this.countMyPendingSignOffs(user);
        const myRequestedSignOffs = await this.getMyRequestedSignOffs(user);
        const myChangeOrders = await this.getMyDraftChangeOrders(user);
        return {
            pendingSignOffCount: myPendingSignOffs,
            requestedSignOffs: myRequestedSignOffs,
            draftChangeOrders: myChangeOrders,
        };
    }
    async countMyPendingSignOffs(user) {
        const queryBuilder = this.signOffRepository
            .createQueryBuilder('so')
            .leftJoin('so.changeOrder', 'co')
            .where('so.status = :status', { status: sign_off_enum_1.SignOffStatus.PENDING })
            .andWhere('(so.changeOrderId IS NULL OR so.processVersion = co.signOffProcessVersion)');
        if (user.role !== role_enum_1.Role.ADMIN) {
            queryBuilder.andWhere('(so.signerRole IS NULL OR so.signerRole = :userRole)', { userRole: user.role });
            queryBuilder.andWhere('(so.signerDepartment IS NULL OR so.signerDepartment = :userDepartment)', { userDepartment: user.department });
        }
        return queryBuilder.getCount();
    }
    async getMyRequestedSignOffs(user) {
        return this.signOffRepository
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.changeOrder', 'co')
            .where('so.requestedById = :userId', { userId: user.id })
            .andWhere('so.status = :status', { status: sign_off_enum_1.SignOffStatus.PENDING })
            .andWhere('(so.changeOrderId IS NULL OR so.processVersion = co.signOffProcessVersion)')
            .orderBy('so.createdAt', 'DESC')
            .take(5)
            .getMany();
    }
    async getMyDraftChangeOrders(user) {
        return this.changeOrderRepository.find({
            where: {
                createdById: user.id,
                status: change_order_status_enum_1.ChangeOrderStatus.DRAFT,
            },
            order: { updatedAt: 'DESC' },
            take: 5,
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(change_order_entity_1.ChangeOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(sign_off_entity_1.SignOff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map