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
exports.WorkOrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const work_order_entity_1 = require("../../entities/work-order.entity");
const status_history_entity_1 = require("../../entities/status-history.entity");
const user_entity_1 = require("../../entities/user.entity");
const downtime_record_entity_1 = require("../../entities/downtime-record.entity");
const spare_part_entity_1 = require("../../entities/spare-part.entity");
const part_usage_entity_1 = require("../../entities/part-usage.entity");
const review_record_entity_1 = require("../../entities/review-record.entity");
const work_order_enum_1 = require("../../common/enums/work-order.enum");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const csvWriter = require("csv-writer");
const path = require("path");
let WorkOrderService = class WorkOrderService {
    constructor(workOrderRepository, statusHistoryRepository, userRepository, downtimeRepository, sparePartRepository, partUsageRepository, reviewRepository, dataSource) {
        this.workOrderRepository = workOrderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.downtimeRepository = downtimeRepository;
        this.sparePartRepository = sparePartRepository;
        this.partUsageRepository = partUsageRepository;
        this.reviewRepository = reviewRepository;
        this.dataSource = dataSource;
    }
    async create(createDto) {
        const orderNo = await this.generateOrderNo();
        const workOrder = this.workOrderRepository.create({
            ...createDto,
            orderNo,
            status: work_order_enum_1.WorkOrderStatus.ABNORMAL_REPORTED,
        });
        const saved = await this.workOrderRepository.save(workOrder);
        await this.createStatusHistory(saved.id, null, work_order_enum_1.WorkOrderStatus.ABNORMAL_REPORTED, '工单创建', createDto.reporterId);
        return this.findOne(saved.id);
    }
    async findAll(queryDto) {
        const { page, limit, sortBy = 'createdAt', sortOrder, status, statuses, abnormalType, station, keyword, reporterId, handlerId, startDate, endDate } = queryDto;
        const queryBuilder = this.workOrderRepository.createQueryBuilder('workOrder')
            .leftJoinAndSelect('workOrder.reporter', 'reporter')
            .leftJoinAndSelect('workOrder.handler', 'handler')
            .leftJoinAndSelect('workOrder.downtimeRecords', 'downtimeRecords')
            .leftJoinAndSelect('workOrder.partUsages', 'partUsages')
            .leftJoinAndSelect('partUsages.sparePart', 'sparePart');
        if (status) {
            queryBuilder.andWhere('workOrder.status = :status', { status });
        }
        else if (statuses && statuses.length > 0) {
            queryBuilder.andWhere('workOrder.status IN (:...statuses)', { statuses });
        }
        if (abnormalType) {
            queryBuilder.andWhere('workOrder.abnormalType = :abnormalType', { abnormalType });
        }
        if (station) {
            queryBuilder.andWhere('workOrder.station = :station', { station });
        }
        if (keyword) {
            queryBuilder.andWhere('(workOrder.title LIKE :keyword OR workOrder.orderNo LIKE :keyword OR workOrder.description LIKE :keyword)', {
                keyword: `%${keyword}%`,
            });
        }
        if (reporterId) {
            queryBuilder.andWhere('workOrder.reporterId = :reporterId', { reporterId });
        }
        if (handlerId) {
            queryBuilder.andWhere('workOrder.handlerId = :handlerId', { handlerId });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('workOrder.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        }
        queryBuilder.orderBy(`workOrder.${sortBy}`, sortOrder);
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return (0, pagination_dto_1.createPaginatedResult)(data, total, page, limit);
    }
    async findOne(id) {
        const workOrder = await this.workOrderRepository.findOne({
            where: { id },
            relations: [
                'reporter',
                'handler',
                'downtimeRecords',
                'partUsages',
                'partUsages.sparePart',
                'partUsages.requestedBy',
                'partUsages.approvedBy',
                'partUsages.receivedBy',
                'reviewRecords',
                'reviewRecords.submittedBy',
                'reviewRecords.verifiedBy',
                'statusHistories',
                'statusHistories.operatedBy',
            ],
        });
        if (!workOrder) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
        }
        return workOrder;
    }
    async update(id, updateDto) {
        await this.findOne(id);
        await this.workOrderRepository.update(id, updateDto);
        return this.findOne(id);
    }
    async assignHandler(id, assignDto) {
        const workOrder = await this.findOne(id);
        const handler = await this.userRepository.findOne({ where: { id: assignDto.handlerId } });
        if (!handler) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.USER_NOT_FOUND, '处理人不存在');
        }
        workOrder.handler = handler;
        workOrder.handlerId = handler.id;
        await this.workOrderRepository.save(workOrder);
        return this.findOne(id);
    }
    async transitionStatus(id, transitionDto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            const currentStatus = workOrder.status;
            const targetStatus = transitionDto.targetStatus;
            if (!this.canTransition(currentStatus, targetStatus)) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INVALID_STATUS_TRANSITION, `无法从 ${currentStatus} 转换到 ${targetStatus}`);
            }
            workOrder.status = targetStatus;
            if (targetStatus === work_order_enum_1.WorkOrderStatus.CLOSED) {
                workOrder.closedAt = new Date();
            }
            await manager.save(workOrder);
            const statusHistory = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId: id,
                fromStatus: currentStatus,
                toStatus: targetStatus,
                remark: transitionDto.remark,
                operatedById: transitionDto.operatorId,
            });
            await manager.save(statusHistory);
            return this.findOne(id);
        });
    }
    async delete(id) {
        const workOrder = await this.findOne(id);
        await this.workOrderRepository.remove(workOrder);
    }
    async exportToCsv(queryDto) {
        const result = await this.findAll({ ...queryDto, page: 1, limit: 10000 });
        const exportPath = path.join(process.cwd(), 'exports');
        const fileName = `work_orders_${Date.now()}.csv`;
        const filePath = path.join(exportPath, fileName);
        const writer = csvWriter.createObjectCsvWriter({
            path: filePath,
            header: [
                { id: 'orderNo', title: '工单号' },
                { id: 'title', title: '标题' },
                { id: 'status', title: '状态' },
                { id: 'abnormalType', title: '异常类型' },
                { id: 'station', title: '电站' },
                { id: 'reporterName', title: '上报人' },
                { id: 'handlerName', title: '处理人' },
                { id: 'totalDowntimeMinutes', title: '停机时长(分钟)' },
                { id: 'powerLoss', title: '发电量损失(kWh)' },
                { id: 'createdAt', title: '创建时间' },
                { id: 'closedAt', title: '关闭时间' },
            ],
        });
        const records = result.data.map(order => ({
            orderNo: order.orderNo,
            title: order.title,
            status: order.status,
            abnormalType: order.abnormalType,
            station: order.station,
            reporterName: order.reporter?.name || '',
            handlerName: order.handler?.name || '',
            totalDowntimeMinutes: order.totalDowntimeMinutes || 0,
            powerLoss: order.powerLoss || 0,
            createdAt: order.createdAt.toISOString(),
            closedAt: order.closedAt?.toISOString() || '',
        }));
        await writer.writeRecords(records);
        return filePath;
    }
    async getStatistics() {
        const statusCounts = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .select('workOrder.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('workOrder.status')
            .getRawMany();
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const totalDowntime = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .select('SUM(workOrder.totalDowntimeMinutes)', 'total')
            .where('workOrder.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .getRawOne();
        const totalPowerLoss = await this.workOrderRepository
            .createQueryBuilder('workOrder')
            .select('SUM(workOrder.powerLoss)', 'total')
            .where('workOrder.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .getRawOne();
        return {
            statusCounts,
            totalDowntimeMinutes: parseInt(totalDowntime.total || '0'),
            totalPowerLoss: parseFloat(totalPowerLoss.total || '0'),
        };
    }
    canTransition(from, to) {
        const allowedTransitions = work_order_enum_1.WorkOrderStatusFlow[from] || [];
        return allowedTransitions.includes(to);
    }
    async generateOrderNo() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const latest = await this.workOrderRepository.findOne({
            where: { orderNo: (0, typeorm_2.Like)(`WO${dateStr}%`) },
            order: { orderNo: 'DESC' },
        });
        let sequence = 1;
        if (latest) {
            const match = latest.orderNo.match(/WO\d{8}(\d{4})/);
            if (match) {
                sequence = parseInt(match[1]) + 1;
            }
        }
        return `WO${dateStr}${String(sequence).padStart(4, '0')}`;
    }
    async confirmDowntime(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            if (workOrder.status !== work_order_enum_1.WorkOrderStatus.ABNORMAL_REPORTED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许确认停机');
            }
            const durationMinutes = dto.endTime
                ? Math.floor((dto.endTime.getTime() - dto.startTime.getTime()) / (1000 * 60))
                : 0;
            const downtime = manager.create(downtime_record_entity_1.DowntimeRecord, {
                workOrderId,
                startTime: dto.startTime,
                endTime: dto.endTime,
                reason: dto.reason,
                durationMinutes,
                isConfirmed: true,
                confirmedById: dto.operatorId,
                confirmedAt: new Date(),
            });
            await manager.save(downtime);
            workOrder.status = work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED;
            workOrder.totalDowntimeMinutes = durationMinutes;
            await manager.save(workOrder);
            const history = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId,
                fromStatus: work_order_enum_1.WorkOrderStatus.ABNORMAL_REPORTED,
                toStatus: work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED,
                remark: dto.remark || '确认停机',
                operatedById: dto.operatorId,
            });
            await manager.save(history);
            return this.findOne(workOrderId);
        });
    }
    async requestPart(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            if (workOrder.status !== work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许申请备件');
            }
            const sparePart = await manager.findOne(spare_part_entity_1.SparePart, { where: { id: dto.sparePartId } });
            if (!sparePart) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_NOT_FOUND, '备件不存在');
            }
            const partUsage = manager.create(part_usage_entity_1.PartUsage, {
                workOrderId,
                sparePartId: dto.sparePartId,
                quantity: dto.quantity,
                requestReason: dto.requestReason,
                requestedById: dto.operatorId,
                unitPrice: sparePart.unitPrice,
                totalPrice: sparePart.unitPrice * dto.quantity,
                status: part_usage_entity_1.PartRequestStatus.PENDING,
            });
            await manager.save(partUsage);
            workOrder.status = work_order_enum_1.WorkOrderStatus.PART_REQUESTED;
            await manager.save(workOrder);
            const history = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId,
                fromStatus: work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED,
                toStatus: work_order_enum_1.WorkOrderStatus.PART_REQUESTED,
                remark: `申请备件: ${sparePart.name} x ${dto.quantity}`,
                operatedById: dto.operatorId,
            });
            await manager.save(history);
            return this.findOne(workOrderId);
        });
    }
    async approvePart(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            if (workOrder.status !== work_order_enum_1.WorkOrderStatus.PART_REQUESTED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许审批备件');
            }
            const partUsage = await manager.findOne(part_usage_entity_1.PartUsage, { where: { id: dto.partUsageId, workOrderId } });
            if (!partUsage) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
            }
            if (partUsage.status !== part_usage_entity_1.PartRequestStatus.PENDING) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INVALID_PART_USAGE_STATUS, '备件领用状态无效');
            }
            const sparePart = await manager.findOne(spare_part_entity_1.SparePart, { where: { id: partUsage.sparePartId } });
            if (dto.status === part_usage_entity_1.PartRequestStatus.APPROVED) {
                if (sparePart.stockQuantity < partUsage.quantity) {
                    throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INSUFFICIENT_STOCK, '库存不足');
                }
                sparePart.stockQuantity -= partUsage.quantity;
                await manager.save(sparePart);
            }
            partUsage.status = dto.status;
            partUsage.approvedById = dto.operatorId;
            partUsage.approvedAt = new Date();
            partUsage.approvalRemark = dto.approvalRemark;
            await manager.save(partUsage);
            if (dto.status === part_usage_entity_1.PartRequestStatus.APPROVED) {
                workOrder.status = work_order_enum_1.WorkOrderStatus.PART_APPROVED;
                await manager.save(workOrder);
                const history = manager.create(status_history_entity_1.StatusHistory, {
                    workOrderId,
                    fromStatus: work_order_enum_1.WorkOrderStatus.PART_REQUESTED,
                    toStatus: work_order_enum_1.WorkOrderStatus.PART_APPROVED,
                    remark: dto.approvalRemark || '备件审批通过',
                    operatedById: dto.operatorId,
                });
                await manager.save(history);
            }
            else if (dto.status === part_usage_entity_1.PartRequestStatus.REJECTED) {
                workOrder.status = work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED;
                await manager.save(workOrder);
                const history = manager.create(status_history_entity_1.StatusHistory, {
                    workOrderId,
                    fromStatus: work_order_enum_1.WorkOrderStatus.PART_REQUESTED,
                    toStatus: work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED,
                    remark: dto.approvalRemark || '备件审批驳回，可重新申请',
                    operatedById: dto.operatorId,
                });
                await manager.save(history);
            }
            return this.findOne(workOrderId);
        });
    }
    async receivePart(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            if (workOrder.status !== work_order_enum_1.WorkOrderStatus.PART_APPROVED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许签收备件');
            }
            const partUsage = await manager.findOne(part_usage_entity_1.PartUsage, { where: { id: dto.partUsageId, workOrderId } });
            if (!partUsage) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
            }
            if (partUsage.status !== part_usage_entity_1.PartRequestStatus.APPROVED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INVALID_PART_USAGE_STATUS, '备件领用状态无效');
            }
            partUsage.status = part_usage_entity_1.PartRequestStatus.RECEIVED;
            partUsage.receivedById = dto.operatorId;
            partUsage.receivedAt = new Date();
            await manager.save(partUsage);
            workOrder.status = work_order_enum_1.WorkOrderStatus.PART_RECEIVED;
            await manager.save(workOrder);
            const history = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId,
                fromStatus: work_order_enum_1.WorkOrderStatus.PART_APPROVED,
                toStatus: work_order_enum_1.WorkOrderStatus.PART_RECEIVED,
                remark: '备件已签收',
                operatedById: dto.operatorId,
            });
            await manager.save(history);
            return this.findOne(workOrderId);
        });
    }
    async completeRepair(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            const fromStatus = workOrder.status;
            if (![work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED, work_order_enum_1.WorkOrderStatus.PART_RECEIVED].includes(fromStatus)) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许完成维修');
            }
            workOrder.status = work_order_enum_1.WorkOrderStatus.REPAIR_COMPLETED;
            await manager.save(workOrder);
            const history = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId,
                fromStatus,
                toStatus: work_order_enum_1.WorkOrderStatus.REPAIR_COMPLETED,
                remark: dto.remark || '维修完成',
                operatedById: dto.operatorId,
            });
            await manager.save(history);
            return this.findOne(workOrderId);
        });
    }
    async submitReview(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            if (workOrder.status !== work_order_enum_1.WorkOrderStatus.REPAIR_COMPLETED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许提交复盘');
            }
            const totalCost = (dto.actualPartCost || 0) + (dto.actualLaborCost || 0);
            const review = manager.create(review_record_entity_1.ReviewRecord, {
                workOrderId,
                level: dto.level || review_record_entity_1.ReviewLevel.MINOR,
                rootCause: dto.rootCause,
                repairProcess: dto.repairProcess,
                improvementMeasures: dto.improvementMeasures,
                lessonsLearned: dto.lessonsLearned,
                actualDowntimeMinutes: dto.actualDowntimeMinutes,
                actualPowerLoss: dto.actualPowerLoss,
                actualPartCost: dto.actualPartCost,
                actualLaborCost: dto.actualLaborCost,
                totalCost,
                submittedById: dto.operatorId,
                submittedAt: new Date(),
            });
            await manager.save(review);
            workOrder.status = work_order_enum_1.WorkOrderStatus.REVIEW_SUBMITTED;
            await manager.save(workOrder);
            const history = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId,
                fromStatus: work_order_enum_1.WorkOrderStatus.REPAIR_COMPLETED,
                toStatus: work_order_enum_1.WorkOrderStatus.REVIEW_SUBMITTED,
                remark: '复盘已提交，等待验证',
                operatedById: dto.operatorId,
            });
            await manager.save(history);
            return this.findOne(workOrderId);
        });
    }
    async verifyReview(workOrderId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            if (workOrder.status !== work_order_enum_1.WorkOrderStatus.REVIEW_SUBMITTED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.OPERATION_NOT_ALLOWED, '当前状态不允许验证复盘');
            }
            const review = await manager.findOne(review_record_entity_1.ReviewRecord, { where: { workOrderId } });
            if (!review) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.REVIEW_NOT_FOUND, '复盘记录不存在');
            }
            if (review.isVerified) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.REVIEW_ALREADY_VERIFIED, '复盘已验证');
            }
            review.isVerified = true;
            review.verifiedById = dto.operatorId;
            review.verifiedAt = new Date();
            await manager.save(review);
            workOrder.status = work_order_enum_1.WorkOrderStatus.CLOSED;
            workOrder.closedAt = new Date();
            await manager.save(workOrder);
            const history = manager.create(status_history_entity_1.StatusHistory, {
                workOrderId,
                fromStatus: work_order_enum_1.WorkOrderStatus.REVIEW_SUBMITTED,
                toStatus: work_order_enum_1.WorkOrderStatus.CLOSED,
                remark: dto.remark || '复盘验证通过，工单关闭',
                operatedById: dto.operatorId,
            });
            await manager.save(history);
            return this.findOne(workOrderId);
        });
    }
    async createStatusHistory(workOrderId, fromStatus, toStatus, remark, operatedById) {
        const history = this.statusHistoryRepository.create({
            workOrderId,
            fromStatus,
            toStatus,
            remark,
            operatedById,
        });
        await this.statusHistoryRepository.save(history);
    }
};
exports.WorkOrderService = WorkOrderService;
exports.WorkOrderService = WorkOrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(status_history_entity_1.StatusHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(downtime_record_entity_1.DowntimeRecord)),
    __param(4, (0, typeorm_1.InjectRepository)(spare_part_entity_1.SparePart)),
    __param(5, (0, typeorm_1.InjectRepository)(part_usage_entity_1.PartUsage)),
    __param(6, (0, typeorm_1.InjectRepository)(review_record_entity_1.ReviewRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], WorkOrderService);
//# sourceMappingURL=work-order.service.js.map