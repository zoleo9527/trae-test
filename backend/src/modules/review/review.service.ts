import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReviewRecord, ReviewLevel } from '../../entities/review-record.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';
import { WorkOrderStatus } from '../../common/enums/work-order.enum';
import { CreateReviewDto, UpdateReviewDto, VerifyReviewDto, QueryReviewDto } from './dto/review.dto';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewRecord)
    private reviewRepository: Repository<ReviewRecord>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateReviewDto): Promise<ReviewRecord> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: createDto.workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      const totalCost = (createDto.actualPartCost || 0) + (createDto.actualLaborCost || 0);

      const review = manager.create(ReviewRecord, {
        ...createDto,
        totalCost,
        level: createDto.level || ReviewLevel.MINOR,
        submittedAt: new Date(),
      });

      const saved = await manager.save(review);

      if (workOrder.status === WorkOrderStatus.REPAIR_COMPLETED) {
        workOrder.status = WorkOrderStatus.REVIEW_SUBMITTED;
        await manager.save(workOrder);
      }

      return this.findOne(saved.id);
    });
  }

  async findAll(queryDto: QueryReviewDto): Promise<PaginatedResult<ReviewRecord>> {
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

    return createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<ReviewRecord> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['workOrder', 'submittedBy', 'verifiedBy'],
    });

    if (!review) {
      throw new BusinessException(ErrorCode.REVIEW_NOT_FOUND, '复盘记录不存在');
    }

    return review;
  }

  async update(id: string, updateDto: UpdateReviewDto): Promise<ReviewRecord> {
    const review = await this.findOne(id);
    
    if (updateDto.actualPartCost !== undefined) review.actualPartCost = updateDto.actualPartCost;
    if (updateDto.actualLaborCost !== undefined) review.actualLaborCost = updateDto.actualLaborCost;
    if (updateDto.actualPartCost !== undefined || updateDto.actualLaborCost !== undefined) {
      review.totalCost = (review.actualPartCost || 0) + (review.actualLaborCost || 0);
    }
    
    Object.assign(review, updateDto);
    
    return this.reviewRepository.save(review);
  }

  async verify(id: string, verifyDto: VerifyReviewDto): Promise<ReviewRecord> {
    return this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(ReviewRecord, { where: { id } });
      if (!review) {
        throw new BusinessException(ErrorCode.REVIEW_NOT_FOUND, '复盘记录不存在');
      }

      if (review.isVerified) {
        throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, '复盘记录已验证');
      }

      review.isVerified = true;
      review.verifiedById = verifyDto.verifiedById;
      review.verifiedAt = new Date();

      await manager.save(review);

      const workOrder = await manager.findOne(WorkOrder, { where: { id: review.workOrderId } });
      if (workOrder && workOrder.status === WorkOrderStatus.REVIEW_SUBMITTED) {
        workOrder.status = WorkOrderStatus.CLOSED;
        workOrder.closedAt = new Date();
        await manager.save(workOrder);
      }

      return this.findOne(id);
    });
  }

  async delete(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
  }
}
