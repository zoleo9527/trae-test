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
exports.SparePartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const spare_part_entity_1 = require("../../entities/spare-part.entity");
const part_usage_entity_1 = require("../../entities/part-usage.entity");
const work_order_entity_1 = require("../../entities/work-order.entity");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
const work_order_enum_1 = require("../../common/enums/work-order.enum");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let SparePartService = class SparePartService {
    constructor(sparePartRepository, partUsageRepository, workOrderRepository, dataSource) {
        this.sparePartRepository = sparePartRepository;
        this.partUsageRepository = partUsageRepository;
        this.workOrderRepository = workOrderRepository;
        this.dataSource = dataSource;
    }
    async createPart(createDto) {
        const existing = await this.sparePartRepository.findOne({ where: { partCode: createDto.partCode } });
        if (existing) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.VALIDATION_ERROR, '备件编码已存在');
        }
        const part = this.sparePartRepository.create(createDto);
        return this.sparePartRepository.save(part);
    }
    async findAllParts(queryDto) {
        const { page, limit, sortBy = 'createdAt', sortOrder, keyword, partCode, manufacturer } = queryDto;
        const queryBuilder = this.sparePartRepository.createQueryBuilder('part');
        if (keyword) {
            queryBuilder.andWhere('(part.name LIKE :keyword OR part.partCode LIKE :keyword OR part.specification LIKE :keyword)', {
                keyword: `%${keyword}%`,
            });
        }
        if (partCode) {
            queryBuilder.andWhere('part.partCode = :partCode', { partCode });
        }
        if (manufacturer) {
            queryBuilder.andWhere('part.manufacturer = :manufacturer', { manufacturer });
        }
        queryBuilder.orderBy(`part.${sortBy}`, sortOrder);
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return (0, pagination_dto_1.createPaginatedResult)(data, total, page, limit);
    }
    async findOnePart(id) {
        const part = await this.sparePartRepository.findOne({ where: { id } });
        if (!part) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_NOT_FOUND, '备件不存在');
        }
        return part;
    }
    async updatePart(id, updateDto) {
        const part = await this.findOnePart(id);
        Object.assign(part, updateDto);
        return this.sparePartRepository.save(part);
    }
    async deletePart(id) {
        const part = await this.findOnePart(id);
        await this.sparePartRepository.remove(part);
    }
    async requestPart(createDto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: createDto.workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            const sparePart = await manager.findOne(spare_part_entity_1.SparePart, { where: { id: createDto.sparePartId } });
            if (!sparePart) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_NOT_FOUND, '备件不存在');
            }
            const partUsage = manager.create(part_usage_entity_1.PartUsage, {
                ...createDto,
                unitPrice: sparePart.unitPrice,
                totalPrice: sparePart.unitPrice * createDto.quantity,
                status: part_usage_entity_1.PartRequestStatus.PENDING,
            });
            const saved = await manager.save(partUsage);
            if (workOrder.status === work_order_enum_1.WorkOrderStatus.DOWNTIME_CONFIRMED) {
                workOrder.status = work_order_enum_1.WorkOrderStatus.PART_REQUESTED;
                await manager.save(workOrder);
            }
            return this.findOneUsage(saved.id);
        });
    }
    async approvePartUsage(id, approveDto) {
        return this.dataSource.transaction(async (manager) => {
            const partUsage = await manager.findOne(part_usage_entity_1.PartUsage, { where: { id } });
            if (!partUsage) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
            }
            if (partUsage.status !== part_usage_entity_1.PartRequestStatus.PENDING) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INVALID_STATUS_TRANSITION, '当前状态不允许审批');
            }
            const sparePart = await manager.findOne(spare_part_entity_1.SparePart, { where: { id: partUsage.sparePartId } });
            if (approveDto.status === part_usage_entity_1.PartRequestStatus.APPROVED) {
                if (sparePart.stockQuantity < partUsage.quantity) {
                    throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INSUFFICIENT_STOCK, '库存不足');
                }
                sparePart.stockQuantity -= partUsage.quantity;
                await manager.save(sparePart);
            }
            partUsage.status = approveDto.status;
            partUsage.approvedById = approveDto.approvedById;
            partUsage.approvedAt = new Date();
            partUsage.approvalRemark = approveDto.approvalRemark;
            await manager.save(partUsage);
            if (approveDto.status === part_usage_entity_1.PartRequestStatus.APPROVED) {
                const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: partUsage.workOrderId } });
                if (workOrder.status === work_order_enum_1.WorkOrderStatus.PART_REQUESTED) {
                    workOrder.status = work_order_enum_1.WorkOrderStatus.PART_APPROVED;
                    await manager.save(workOrder);
                }
            }
            return this.findOneUsage(id);
        });
    }
    async receivePartUsage(id, receiveDto) {
        return this.dataSource.transaction(async (manager) => {
            const partUsage = await manager.findOne(part_usage_entity_1.PartUsage, { where: { id } });
            if (!partUsage) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
            }
            if (partUsage.status !== part_usage_entity_1.PartRequestStatus.APPROVED) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INVALID_STATUS_TRANSITION, '当前状态不允许签收');
            }
            partUsage.status = part_usage_entity_1.PartRequestStatus.RECEIVED;
            partUsage.receivedById = receiveDto.receivedById;
            partUsage.receivedAt = new Date();
            await manager.save(partUsage);
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: partUsage.workOrderId } });
            if (workOrder.status === work_order_enum_1.WorkOrderStatus.PART_APPROVED) {
                workOrder.status = work_order_enum_1.WorkOrderStatus.PART_RECEIVED;
                await manager.save(workOrder);
            }
            return this.findOneUsage(id);
        });
    }
    async findAllUsages(queryDto) {
        const { page, limit, sortBy = 'createdAt', sortOrder, workOrderId, status, sparePartId } = queryDto;
        const queryBuilder = this.partUsageRepository.createQueryBuilder('usage')
            .leftJoinAndSelect('usage.sparePart', 'sparePart')
            .leftJoinAndSelect('usage.workOrder', 'workOrder')
            .leftJoinAndSelect('usage.requestedBy', 'requestedBy')
            .leftJoinAndSelect('usage.approvedBy', 'approvedBy')
            .leftJoinAndSelect('usage.receivedBy', 'receivedBy');
        if (workOrderId) {
            queryBuilder.andWhere('usage.workOrderId = :workOrderId', { workOrderId });
        }
        if (status) {
            queryBuilder.andWhere('usage.status = :status', { status });
        }
        if (sparePartId) {
            queryBuilder.andWhere('usage.sparePartId = :sparePartId', { sparePartId });
        }
        queryBuilder.orderBy(`usage.${sortBy}`, sortOrder);
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return (0, pagination_dto_1.createPaginatedResult)(data, total, page, limit);
    }
    async findOneUsage(id) {
        const usage = await this.partUsageRepository.findOne({
            where: { id },
            relations: ['sparePart', 'workOrder', 'requestedBy', 'approvedBy', 'receivedBy'],
        });
        if (!usage) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
        }
        return usage;
    }
};
exports.SparePartService = SparePartService;
exports.SparePartService = SparePartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(spare_part_entity_1.SparePart)),
    __param(1, (0, typeorm_1.InjectRepository)(part_usage_entity_1.PartUsage)),
    __param(2, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], SparePartService);
//# sourceMappingURL=spare-part.service.js.map