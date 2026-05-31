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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const change_order_entity_1 = require("./change-order/entities/change-order.entity");
const sign_off_entity_1 = require("./sign-off/entities/sign-off.entity");
const change_order_status_enum_1 = require("./common/enums/change-order-status.enum");
const sign_off_enum_1 = require("./common/enums/sign-off.enum");
const role_enum_1 = require("./common/enums/role.enum");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
let AppController = class AppController {
    constructor(changeOrderRepository, signOffRepository) {
        this.changeOrderRepository = changeOrderRepository;
        this.signOffRepository = signOffRepository;
    }
    getStatus() {
        return {
            name: '地坪施工-变更报价与签认留痕系统',
            version: '1.0.0',
            status: 'running',
            docs: '/api',
            demo: {
                login: 'POST /auth/login',
                dashboard: 'GET /home (需登录)',
                accounts: {
                    admin: 'admin / admin123',
                    project_manager: 'pm01 / pm123456',
                    supervisor: 'super01 / super123',
                    foreman: 'foreman01 / foreman123',
                    worker: 'worker01 / worker123',
                    accountant: 'account01 / account123',
                    client: 'client01 / client123',
                },
            },
        };
    }
    async getHomeData(req) {
        const user = req.user;
        const [pendingChangeOrders, rejectedChangeOrders, pendingSignOffs, totalChangeOrders] = await Promise.all([
            this.getPendingChangeOrdersForUser(user),
            this.changeOrderRepository.find({
                where: {
                    status: change_order_status_enum_1.ChangeOrderStatus.REJECTED,
                },
                relations: ['createdBy', 'approvedBy'],
                order: { updatedAt: 'DESC' },
                take: 10,
            }),
            this.getPendingSignOffsForUser(user),
            this.changeOrderRepository.count(),
        ]);
        const needsReviewQuery = this.changeOrderRepository
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
            needsReviewQuery.andWhere('(so.signerRole IS NULL OR so.signerRole = :userRole)', { userRole: user.role });
        }
        const needsReview = await needsReviewQuery
            .orderBy('co.createdAt', 'DESC')
            .take(10)
            .getMany();
        const statusStatistics = await this.changeOrderRepository
            .createQueryBuilder('co')
            .select('co.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('co.status')
            .getRawMany();
        const statistics = {};
        for (const status of Object.values(change_order_status_enum_1.ChangeOrderStatus)) {
            statistics[status] = 0;
        }
        for (const row of statusStatistics) {
            statistics[row.status] = parseInt(row.count, 10);
        }
        return {
            summary: {
                pendingChangeOrders: pendingChangeOrders.length,
                rejectedChangeOrders: rejectedChangeOrders.length,
                pendingSignOffs: pendingSignOffs.length,
                needsReview: needsReview.length,
                totalChangeOrders,
            },
            pending: {
                changeOrders: pendingChangeOrders,
                signOffs: pendingSignOffs,
            },
            rejected: {
                changeOrders: rejectedChangeOrders,
            },
            needsReview: {
                changeOrders: needsReview,
            },
            statistics,
        };
    }
    async getPendingChangeOrdersForUser(user) {
        const queryBuilder = this.changeOrderRepository.createQueryBuilder('co')
            .leftJoinAndSelect('co.createdBy', 'createdBy')
            .leftJoin('co.signOffs', 'so');
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
        const queryBuilder = this.signOffRepository.createQueryBuilder('so')
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
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '系统信息与演示入口' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('home'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: '首页聚合数据 - 待处理、已驳回、需回查' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHomeData", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('首页'),
    (0, common_1.Controller)(),
    __param(0, (0, typeorm_1.InjectRepository)(change_order_entity_1.ChangeOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(sign_off_entity_1.SignOff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AppController);
//# sourceMappingURL=app.controller.js.map