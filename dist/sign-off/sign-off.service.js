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
exports.SignOffService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sign_off_entity_1 = require("./entities/sign-off.entity");
const change_order_entity_1 = require("../change-order/entities/change-order.entity");
const sign_off_enum_1 = require("../common/enums/sign-off.enum");
const change_order_status_enum_1 = require("../common/enums/change-order-status.enum");
const audit_enum_1 = require("../common/enums/audit.enum");
const role_enum_1 = require("../common/enums/role.enum");
const audit_service_1 = require("../audit/audit.service");
let SignOffService = class SignOffService {
    constructor(signOffRepository, changeOrderRepository, dataSource, auditService) {
        this.signOffRepository = signOffRepository;
        this.changeOrderRepository = changeOrderRepository;
        this.dataSource = dataSource;
        this.auditService = auditService;
    }
    async create(createDto, user) {
        let processVersion = 1;
        if (createDto.changeOrderId) {
            const changeOrder = await this.changeOrderRepository.findOne({
                where: { id: createDto.changeOrderId },
            });
            if (changeOrder) {
                processVersion = changeOrder.signOffProcessVersion;
            }
        }
        const signOff = this.signOffRepository.create({
            ...createDto,
            requestedById: user.id,
            requestedBy: user,
            status: sign_off_enum_1.SignOffStatus.PENDING,
            processVersion,
        });
        const saved = await this.signOffRepository.save(signOff);
        await this.auditService.createLog({
            action: audit_enum_1.AuditAction.CREATE,
            entityType: audit_enum_1.AuditEntityType.SIGN_OFF,
            entityId: saved.id,
            entityName: `签认-${saved.signOffType}`,
            user,
            newValues: saved,
            description: '创建签认请求',
        });
        return this.findOne(saved.id);
    }
    async findAll(page = 1, limit = 20, filters) {
        const queryBuilder = this.signOffRepository.createQueryBuilder('so')
            .leftJoinAndSelect('so.requestedBy', 'requestedBy')
            .leftJoinAndSelect('so.signedBy', 'signedBy');
        if (filters?.status) {
            queryBuilder.andWhere('so.status = :status', { status: filters.status });
        }
        if (filters?.signOffType) {
            queryBuilder.andWhere('so.signOffType = :signOffType', { signOffType: filters.signOffType });
        }
        const [data, total] = await queryBuilder
            .orderBy('so.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const signOff = await this.signOffRepository.findOne({
            where: { id },
            relations: ['requestedBy', 'signedBy', 'changeOrder', 'dailyReport', 'delivery'],
        });
        if (!signOff) {
            throw new common_1.NotFoundException('签认记录不存在');
        }
        return signOff;
    }
    canUserSign(signOff, user) {
        if (user.role === role_enum_1.Role.ADMIN) {
            return true;
        }
        if (signOff.signerRole && signOff.signerRole !== user.role) {
            return false;
        }
        if (signOff.signerDepartment && signOff.signerDepartment !== user.department) {
            return false;
        }
        return true;
    }
    async sign(id, actionDto, user) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const signOff = await this.findOne(id);
            if (signOff.status !== sign_off_enum_1.SignOffStatus.PENDING) {
                throw new common_1.BadRequestException('只能签认待处理的记录');
            }
            if (!this.canUserSign(signOff, user)) {
                throw new common_1.ForbiddenException(`您没有权限签认此记录。需要角色: ${signOff.signerRole || '不限'}, 需要部门: ${signOff.signerDepartment || '不限'}`);
            }
            signOff.status = sign_off_enum_1.SignOffStatus.SIGNED;
            signOff.signedById = user.id;
            signOff.signedBy = user;
            signOff.signedAt = new Date();
            signOff.comments = actionDto.comments;
            signOff.signature = actionDto.signature;
            const savedSignOff = await queryRunner.manager.save(signOff);
            if (signOff.signOffType === sign_off_enum_1.SignOffType.CHANGE_ORDER && signOff.changeOrderId) {
                await this.handleChangeOrderSignOffApproval(queryRunner, signOff, user);
            }
            await queryRunner.commitTransaction();
            await this.auditService.createLog({
                action: audit_enum_1.AuditAction.SIGN_OFF,
                entityType: audit_enum_1.AuditEntityType.SIGN_OFF,
                entityId: id,
                entityName: `签认-${signOff.signOffType}`,
                user,
                oldValues: { status: sign_off_enum_1.SignOffStatus.PENDING },
                newValues: { status: sign_off_enum_1.SignOffStatus.SIGNED },
                description: '签认通过',
            });
            return this.findOne(id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async handleChangeOrderSignOffApproval(queryRunner, signOff, user) {
        const changeOrder = await queryRunner.manager.findOne(change_order_entity_1.ChangeOrder, {
            where: { id: signOff.changeOrderId },
        });
        if (!changeOrder) {
            return;
        }
        if (signOff.processVersion !== changeOrder.signOffProcessVersion) {
            return;
        }
        const currentProcessVersion = changeOrder.signOffProcessVersion;
        const sequenceToStatus = {
            1: change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
            2: change_order_status_enum_1.ChangeOrderStatus.APPROVED,
            3: change_order_status_enum_1.ChangeOrderStatus.IN_PROGRESS,
        };
        const nextStatus = sequenceToStatus[signOff.sequenceOrder];
        if (nextStatus) {
            changeOrder.status = nextStatus;
            changeOrder.currentVersion += 1;
            if (nextStatus === change_order_status_enum_1.ChangeOrderStatus.APPROVED) {
                changeOrder.approvedById = user.id;
                changeOrder.approvedDate = new Date();
            }
            await queryRunner.manager.save(changeOrder);
            await this.auditService.createLog({
                action: audit_enum_1.AuditAction.STATUS_CHANGE,
                entityType: audit_enum_1.AuditEntityType.CHANGE_ORDER,
                entityId: changeOrder.id,
                entityName: changeOrder.title,
                user,
                oldValues: { status: signOff.changeOrder?.status },
                newValues: { status: nextStatus },
                description: `签认通过，状态自动变更: ${signOff.changeOrder?.status} → ${nextStatus}`,
            });
        }
        const nextSequenceConfigs = [
            {
                sequence: 2,
                signerRole: role_enum_1.Role.PROJECT_MANAGER,
                signerDepartment: '工程部',
                requiredStatus: change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                comments: '监理初审通过，需项目经理审核',
            },
            {
                sequence: 3,
                signerRole: role_enum_1.Role.CLIENT,
                signerDepartment: '甲方项目部',
                requiredStatus: change_order_status_enum_1.ChangeOrderStatus.APPROVED,
                comments: '项目内部审核通过，需甲方确认',
            },
        ];
        for (const config of nextSequenceConfigs) {
            if (signOff.sequenceOrder === config.sequence - 1) {
                const existingNextSignOff = await queryRunner.manager.findOne(sign_off_entity_1.SignOff, {
                    where: {
                        changeOrderId: changeOrder.id,
                        sequenceOrder: config.sequence,
                        processVersion: currentProcessVersion,
                    },
                });
                if (!existingNextSignOff) {
                    const nextSignOff = queryRunner.manager.create(sign_off_entity_1.SignOff, {
                        signOffType: sign_off_enum_1.SignOffType.CHANGE_ORDER,
                        changeOrderId: changeOrder.id,
                        changeOrder,
                        requestedById: user.id,
                        requestedBy: user,
                        status: sign_off_enum_1.SignOffStatus.PENDING,
                        sequenceOrder: config.sequence,
                        comments: config.comments,
                        signerRole: config.signerRole,
                        signerDepartment: config.signerDepartment,
                        processVersion: currentProcessVersion,
                    });
                    await queryRunner.manager.save(nextSignOff);
                    await this.auditService.createLog({
                        action: audit_enum_1.AuditAction.CREATE,
                        entityType: audit_enum_1.AuditEntityType.SIGN_OFF,
                        entityId: nextSignOff.id,
                        entityName: `签认-${sign_off_enum_1.SignOffType.CHANGE_ORDER}-${config.sequence}`,
                        user,
                        newValues: nextSignOff,
                        description: `自动生成下一级签认: ${config.signerRole}`,
                    });
                }
                break;
            }
        }
    }
    async reject(id, actionDto, user) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const signOff = await this.findOne(id);
            if (signOff.status !== sign_off_enum_1.SignOffStatus.PENDING) {
                throw new common_1.BadRequestException('只能驳回待处理的记录');
            }
            if (!this.canUserSign(signOff, user)) {
                throw new common_1.ForbiddenException(`您没有权限驳回此记录。需要角色: ${signOff.signerRole || '不限'}, 需要部门: ${signOff.signerDepartment || '不限'}`);
            }
            signOff.status = sign_off_enum_1.SignOffStatus.REJECTED;
            signOff.signedById = user.id;
            signOff.signedBy = user;
            signOff.signedAt = new Date();
            signOff.rejectReason = actionDto.rejectReason;
            signOff.comments = actionDto.comments;
            const savedSignOff = await queryRunner.manager.save(signOff);
            if (signOff.signOffType === sign_off_enum_1.SignOffType.CHANGE_ORDER && signOff.changeOrderId) {
                const changeOrder = await queryRunner.manager.findOne(change_order_entity_1.ChangeOrder, {
                    where: { id: signOff.changeOrderId },
                });
                if (changeOrder) {
                    const oldStatus = changeOrder.status;
                    changeOrder.status = change_order_status_enum_1.ChangeOrderStatus.REJECTED;
                    changeOrder.rejectReason = actionDto.rejectReason || '签认被驳回';
                    changeOrder.currentVersion += 1;
                    await queryRunner.manager.save(changeOrder);
                    await queryRunner.manager.update(sign_off_entity_1.SignOff, {
                        changeOrderId: changeOrder.id,
                        status: sign_off_enum_1.SignOffStatus.PENDING,
                    }, {
                        status: sign_off_enum_1.SignOffStatus.REJECTED,
                        signedById: user.id,
                        signedBy: user,
                        signedAt: new Date(),
                        rejectReason: '变更单被驳回',
                    });
                    await this.auditService.createLog({
                        action: audit_enum_1.AuditAction.STATUS_CHANGE,
                        entityType: audit_enum_1.AuditEntityType.CHANGE_ORDER,
                        entityId: changeOrder.id,
                        entityName: changeOrder.title,
                        user,
                        oldValues: { status: oldStatus },
                        newValues: { status: change_order_status_enum_1.ChangeOrderStatus.REJECTED },
                        description: `签认驳回，变更单状态自动变更: ${oldStatus} → rejected，原因: ${actionDto.rejectReason || '未说明原因'}`,
                    });
                }
            }
            await queryRunner.commitTransaction();
            await this.auditService.createLog({
                action: audit_enum_1.AuditAction.SIGN_OFF_REJECT,
                entityType: audit_enum_1.AuditEntityType.SIGN_OFF,
                entityId: id,
                entityName: `签认-${signOff.signOffType}`,
                user,
                oldValues: { status: sign_off_enum_1.SignOffStatus.PENDING },
                newValues: { status: sign_off_enum_1.SignOffStatus.REJECTED },
                description: `签认驳回: ${actionDto.rejectReason || '未说明原因'}`,
            });
            return this.findOne(id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findByChangeOrder(changeOrderId) {
        return this.signOffRepository.find({
            where: { changeOrderId },
            relations: ['requestedBy', 'signedBy'],
            order: { createdAt: 'DESC' },
        });
    }
    async getPendingForUser(user) {
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
            .getMany();
    }
    async getMySigned(user) {
        return this.signOffRepository.find({
            where: { signedById: user.id },
            relations: ['requestedBy', 'changeOrder'],
            order: { signedAt: 'DESC' },
        });
    }
    async getMyRequested(user) {
        return this.signOffRepository.find({
            where: { requestedById: user.id },
            relations: ['signedBy', 'changeOrder'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.SignOffService = SignOffService;
exports.SignOffService = SignOffService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sign_off_entity_1.SignOff)),
    __param(1, (0, typeorm_1.InjectRepository)(change_order_entity_1.ChangeOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        audit_service_1.AuditService])
], SignOffService);
//# sourceMappingURL=sign-off.service.js.map