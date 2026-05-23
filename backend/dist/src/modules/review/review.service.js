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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_record_entity_1 = require("../../entities/review-record.entity");
const work_order_entity_1 = require("../../entities/work-order.entity");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
const work_order_enum_1 = require("../../common/enums/work-order.enum");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ReviewService = class ReviewService {
    constructor(reviewRepository, workOrderRepository, dataSource) {
        this.reviewRepository = reviewRepository;
        this.workOrderRepository = workOrderRepository;
        this.dataSource = dataSource;
    }
    async create(createDto) {
        return this.dataSource.transaction(async (manager) => {
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: createDto.workOrderId } });
            if (!workOrder) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
            }
            const totalCost = (createDto.actualPartCost || 0) + (createDto.actualLaborCost || 0);
            const review = manager.create(review_record_entity_1.ReviewRecord, {
                ...createDto,
                totalCost,
                level: createDto.level || review_record_entity_1.ReviewLevel.MINOR,
                submittedAt: new Date(),
            });
            const saved = await manager.save(review);
            if (workOrder.status === work_order_enum_1.WorkOrderStatus.REPAIR_COMPLETED) {
                workOrder.status = work_order_enum_1.WorkOrderStatus.REVIEW_SUBMITTED;
                await manager.save(workOrder);
            }
            return this.findOne(saved.id);
        });
    }
    async findAll(queryDto) {
        const { page, limit, sortBy = 'createdAt', sortOrder, workOrderId, level, isVerified } = queryDto;
        const queryBuilder = this.reviewRepository.createQueryBuilder('review')
            .leftJoinAndSelect('review.workOrder', 'workOrder')
            .leftJoinAndSelect('review.submittedBy', 'submittedBy')
            .leftJoinAndSelect('review.verifiedBy', 'verifiedBy');
        if (workOrderId) {
            queryBuilder.andWhere('review.workOrderId = :workOrderId', { workOrderId });
        }
        if (level) {
            queryBuilder.andWhere('review.level = :level', { level });
        }
        if (isVerified !== undefined) {
            queryBuilder.andWhere('review.isVerified = :isVerified', { isVerified });
        }
        queryBuilder.orderBy(`review.${sortBy}`, sortOrder);
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return (0, pagination_dto_1.createPaginatedResult)(data, total, page, limit);
    }
    async findOne(id) {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['workOrder', 'submittedBy', 'verifiedBy'],
        });
        if (!review) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.REVIEW_NOT_FOUND, '复盘记录不存在');
        }
        return review;
    }
    async update(id, updateDto) {
        const review = await this.findOne(id);
        if (updateDto.actualPartCost !== undefined)
            review.actualPartCost = updateDto.actualPartCost;
        if (updateDto.actualLaborCost !== undefined)
            review.actualLaborCost = updateDto.actualLaborCost;
        if (updateDto.actualPartCost !== undefined || updateDto.actualLaborCost !== undefined) {
            review.totalCost = (review.actualPartCost || 0) + (review.actualLaborCost || 0);
        }
        Object.assign(review, updateDto);
        return this.reviewRepository.save(review);
    }
    async verify(id, verifyDto) {
        return this.dataSource.transaction(async (manager) => {
            const review = await manager.findOne(review_record_entity_1.ReviewRecord, { where: { id } });
            if (!review) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.REVIEW_NOT_FOUND, '复盘记录不存在');
            }
            if (review.isVerified) {
                throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.INVALID_STATUS_TRANSITION, '复盘记录已验证');
            }
            review.isVerified = true;
            review.verifiedById = verifyDto.verifiedById;
            review.verifiedAt = new Date();
            await manager.save(review);
            const workOrder = await manager.findOne(work_order_entity_1.WorkOrder, { where: { id: review.workOrderId } });
            if (workOrder && workOrder.status === work_order_enum_1.WorkOrderStatus.REVIEW_SUBMITTED) {
                workOrder.status = work_order_enum_1.WorkOrderStatus.CLOSED;
                workOrder.closedAt = new Date();
                await manager.save(workOrder);
            }
            return this.findOne(id);
        });
    }
    async delete(id) {
        const review = await this.findOne(id);
        await this.reviewRepository.remove(review);
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_record_entity_1.ReviewRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ReviewService);
//# sourceMappingURL=review.service.js.map