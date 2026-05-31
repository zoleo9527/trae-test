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
exports.ChangeOrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const change_order_entity_1 = require("./entities/change-order.entity");
const change_order_version_entity_1 = require("./entities/change-order-version.entity");
const change_order_status_enum_1 = require("../common/enums/change-order-status.enum");
const audit_enum_1 = require("../common/enums/audit.enum");
const sign_off_enum_1 = require("../common/enums/sign-off.enum");
const role_enum_1 = require("../common/enums/role.enum");
const audit_service_1 = require("../audit/audit.service");
const sign_off_entity_1 = require("../sign-off/entities/sign-off.entity");
let ChangeOrderService = class ChangeOrderService {
    constructor(changeOrderRepository, versionRepository, signOffRepository, dataSource, auditService) {
        this.changeOrderRepository = changeOrderRepository;
        this.versionRepository = versionRepository;
        this.signOffRepository = signOffRepository;
        this.dataSource = dataSource;
        this.auditService = auditService;
    }
    generateOrderNumber() {
        const date = new Date();
        const prefix = `CO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${random}`;
    }
    async create(createDto, user) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const changeOrder = this.changeOrderRepository.create({
                ...createDto,
                orderNumber: this.generateOrderNumber(),
                createdById: user.id,
                createdBy: user,
            });
            const savedOrder = await queryRunner.manager.save(changeOrder);
            await this.createVersion(queryRunner, savedOrder, 1, savedOrder, null, user, '创建变更单');
            await queryRunner.commitTransaction();
            await this.auditService.createLog({
                action: audit_enum_1.AuditAction.CREATE,
                entityType: audit_enum_1.AuditEntityType.CHANGE_ORDER,
                entityId: savedOrder.id,
                entityName: savedOrder.title,
                user,
                newValues: savedOrder,
                description: '创建变更单',
            });
            return this.findOne(savedOrder.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll(page = 1, limit = 20, filters) {
        const queryBuilder = this.changeOrderRepository.createQueryBuilder('co')
            .leftJoinAndSelect('co.createdBy', 'createdBy')
            .leftJoinAndSelect('co.approvedBy', 'approvedBy');
        if (filters?.status) {
            queryBuilder.andWhere('co.status = :status', { status: filters.status });
        }
        if (filters?.projectId) {
            queryBuilder.andWhere('co.projectId = :projectId', { projectId: filters.projectId });
        }
        if (filters?.changeType) {
            queryBuilder.andWhere('co.changeType = :changeType', { changeType: filters.changeType });
        }
        const [data, total] = await queryBuilder
            .orderBy('co.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const changeOrder = await this.changeOrderRepository.findOne({
            where: { id },
            relations: ['createdBy', 'approvedBy', 'versions', 'signOffs', 'dailyReports', 'deliveries'],
        });
        if (!changeOrder) {
            throw new common_1.NotFoundException('变更单不存在');
        }
        return changeOrder;
    }
    async update(id, updateDto, user) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const changeOrder = await this.findOne(id);
            const oldValues = { ...changeOrder };
            if (changeOrder.status !== change_order_status_enum_1.ChangeOrderStatus.DRAFT && changeOrder.status !== change_order_status_enum_1.ChangeOrderStatus.REJECTED) {
                throw new common_1.BadRequestException('只能编辑草稿或已驳回的变更单');
            }
            Object.assign(changeOrder, updateDto);
            changeOrder.currentVersion += 1;
            const updatedOrder = await queryRunner.manager.save(changeOrder);
            await this.createVersion(queryRunner, updatedOrder, updatedOrder.currentVersion, updatedOrder, oldValues, user, '更新变更单');
            await queryRunner.commitTransaction();
            await this.auditService.createLog({
                action: audit_enum_1.AuditAction.UPDATE,
                entityType: audit_enum_1.AuditEntityType.CHANGE_ORDER,
                entityId: id,
                entityName: updatedOrder.title,
                user,
                oldValues,
                newValues: updatedOrder,
                description: '更新变更单内容',
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
    async transitionStatus(id, transitionDto, user) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const changeOrder = await this.findOne(id);
            const oldStatus = changeOrder.status;
            const { targetStatus, reason } = transitionDto;
            const allowedTransitions = change_order_status_enum_1.ChangeOrderStatusFlow[changeOrder.status] || [];
            if (!allowedTransitions.includes(targetStatus)) {
                throw new common_1.BadRequestException(`无法从 ${changeOrder.status} 转换到 ${targetStatus}，允许的转换: ${allowedTransitions.join(', ')}`);
            }
            await this.checkPendingSignOffs(changeOrder, targetStatus, user);
            changeOrder.status = targetStatus;
            changeOrder.currentVersion += 1;
            if (targetStatus === change_order_status_enum_1.ChangeOrderStatus.APPROVED) {
                changeOrder.approvedById = user.id;
                changeOrder.approvedBy = user;
                changeOrder.approvedDate = new Date();
            }
            else if (targetStatus === change_order_status_enum_1.ChangeOrderStatus.REJECTED) {
                changeOrder.rejectReason = reason;
            }
            else if (targetStatus === change_order_status_enum_1.ChangeOrderStatus.COMPLETED) {
                changeOrder.completedDate = new Date();
            }
            else if (targetStatus === change_order_status_enum_1.ChangeOrderStatus.SETTLED) {
                changeOrder.settledDate = new Date();
            }
            const updatedOrder = await queryRunner.manager.save(changeOrder);
            await this.createVersion(queryRunner, updatedOrder, updatedOrder.currentVersion, updatedOrder, { status: oldStatus }, user, `状态变更: ${oldStatus} → ${targetStatus}`);
            await this.autoGenerateSignOffs(queryRunner, updatedOrder, oldStatus, targetStatus, user);
            await queryRunner.commitTransaction();
            await this.auditService.createLog({
                action: audit_enum_1.AuditAction.STATUS_CHANGE,
                entityType: audit_enum_1.AuditEntityType.CHANGE_ORDER,
                entityId: id,
                entityName: updatedOrder.title,
                user,
                oldValues: { status: oldStatus },
                newValues: { status: targetStatus },
                description: `状态变更: ${oldStatus} → ${targetStatus}${reason ? `，原因: ${reason}` : ''}`,
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
    async autoGenerateSignOffs(queryRunner, changeOrder, oldStatus, targetStatus, user) {
        if (oldStatus === change_order_status_enum_1.ChangeOrderStatus.REJECTED && targetStatus === change_order_status_enum_1.ChangeOrderStatus.SUBMITTED) {
            changeOrder.signOffProcessVersion += 1;
            await queryRunner.manager.save(changeOrder);
        }
        const currentProcessVersion = changeOrder.signOffProcessVersion;
        const signOffConfigs = [
            {
                triggerStatus: change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                signerRole: role_enum_1.Role.SUPERVISOR,
                signerDepartment: '监理部',
                sequence: 1,
                comments: '变更单提交后，需监理初审',
            },
            {
                triggerStatus: change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
                signerRole: role_enum_1.Role.PROJECT_MANAGER,
                signerDepartment: '工程部',
                sequence: 2,
                comments: '监理初审通过后，需项目经理审核',
            },
            {
                triggerStatus: change_order_status_enum_1.ChangeOrderStatus.APPROVED,
                signerRole: role_enum_1.Role.CLIENT,
                signerDepartment: '甲方项目部',
                sequence: 3,
                comments: '项目内部审核通过后，需甲方确认',
            },
        ];
        for (const config of signOffConfigs) {
            if (targetStatus === config.triggerStatus) {
                const existingSignOff = await queryRunner.manager.findOne(sign_off_entity_1.SignOff, {
                    where: {
                        changeOrderId: changeOrder.id,
                        signerRole: config.signerRole,
                        sequenceOrder: config.sequence,
                        processVersion: currentProcessVersion,
                    },
                });
                if (!existingSignOff) {
                    const signOff = queryRunner.manager.create(sign_off_entity_1.SignOff, {
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
                    await queryRunner.manager.save(signOff);
                }
            }
        }
        if (targetStatus === change_order_status_enum_1.ChangeOrderStatus.REJECTED) {
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
        }
    }
    async checkPendingSignOffs(changeOrder, targetStatus, user) {
        const bypassStatuses = [
            change_order_status_enum_1.ChangeOrderStatus.DRAFT,
            change_order_status_enum_1.ChangeOrderStatus.REJECTED,
            change_order_status_enum_1.ChangeOrderStatus.CANCELLED,
        ];
        if (bypassStatuses.includes(changeOrder.status)) {
            return;
        }
        const finalStatuses = [
            change_order_status_enum_1.ChangeOrderStatus.REJECTED,
            change_order_status_enum_1.ChangeOrderStatus.CANCELLED,
        ];
        if (finalStatuses.includes(targetStatus)) {
            return;
        }
        const currentProcessVersion = changeOrder.signOffProcessVersion;
        const pendingSignOffs = await this.signOffRepository.find({
            where: {
                changeOrderId: changeOrder.id,
                status: sign_off_enum_1.SignOffStatus.PENDING,
                processVersion: currentProcessVersion,
            },
        });
        if (pendingSignOffs.length > 0) {
            const pendingRoles = pendingSignOffs.map((s) => s.signerRole).join(', ');
            throw new common_1.BadRequestException(`当前存在待签认记录（第${currentProcessVersion}轮流程），无法直接推进状态。请先完成以下角色的签认: ${pendingRoles}，或通过签认接口自动推进状态。`);
        }
    }
    async createVersion(queryRunner, changeOrder, versionNumber, newData, oldData, user, summary) {
        const changes = oldData ? this.calculateChanges(oldData, newData) : [];
        const version = this.versionRepository.create({
            changeOrderId: changeOrder.id,
            changeOrder,
            versionNumber,
            snapshotData: JSON.parse(JSON.stringify(newData)),
            changeSummary: summary,
            changes,
            createdById: user.id,
            createdBy: user,
        });
        return queryRunner.manager.save(version);
    }
    calculateChanges(oldData, newData) {
        const changes = [];
        const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
        const ignoredFields = ['createdAt', 'updatedAt', 'deletedAt', 'versions'];
        for (const field of allFields) {
            if (ignoredFields.includes(field))
                continue;
            const oldValue = oldData[field];
            const newValue = newData[field];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({ field, oldValue, newValue });
            }
        }
        return changes;
    }
    async getVersions(id) {
        await this.findOne(id);
        return this.versionRepository.find({
            where: { changeOrderId: id },
            relations: ['createdBy'],
            order: { versionNumber: 'DESC' },
        });
    }
    async getVersion(id, versionNumber) {
        const version = await this.versionRepository.findOne({
            where: { changeOrderId: id, versionNumber },
            relations: ['createdBy'],
        });
        if (!version) {
            throw new common_1.NotFoundException('版本不存在');
        }
        return version;
    }
    async getPendingForUser(user) {
        const queryBuilder = this.changeOrderRepository.createQueryBuilder('co')
            .leftJoinAndSelect('co.createdBy', 'createdBy')
            .where('co.status IN (:...statuses)', {
            statuses: [
                change_order_status_enum_1.ChangeOrderStatus.SUBMITTED,
                change_order_status_enum_1.ChangeOrderStatus.UNDER_REVIEW,
            ],
        })
            .orderBy('co.createdAt', 'DESC');
        return queryBuilder.getMany();
    }
    async getRejectedForUser(user) {
        return this.changeOrderRepository.find({
            where: {
                status: change_order_status_enum_1.ChangeOrderStatus.REJECTED,
            },
            relations: ['createdBy'],
            order: { updatedAt: 'DESC' },
        });
    }
    async getNeedsReview(user) {
        return this.changeOrderRepository
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
            .andWhere('(so.status IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' })
            .orderBy('co.createdAt', 'DESC')
            .getMany();
    }
    async getStatistics() {
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
};
exports.ChangeOrderService = ChangeOrderService;
exports.ChangeOrderService = ChangeOrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(change_order_entity_1.ChangeOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(change_order_version_entity_1.ChangeOrderVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(sign_off_entity_1.SignOff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        audit_service_1.AuditService])
], ChangeOrderService);
//# sourceMappingURL=change-order.service.js.map