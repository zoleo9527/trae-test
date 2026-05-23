import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage, PartRequestStatus } from '../../entities/part-usage.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';
import { WorkOrderStatus } from '../../common/enums/work-order.enum';
import { CreateSparePartDto, UpdateSparePartDto, QuerySparePartDto, CreatePartUsageDto, ApprovePartUsageDto, ReceivePartUsageDto, QueryPartUsageDto } from './dto/spare-part.dto';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SparePartService {
  constructor(
    @InjectRepository(SparePart)
    private sparePartRepository: Repository<SparePart>,
    @InjectRepository(PartUsage)
    private partUsageRepository: Repository<PartUsage>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
    private dataSource: DataSource,
  ) {}

  async createPart(createDto: CreateSparePartDto): Promise<SparePart> {
    const existing = await this.sparePartRepository.findOne({ where: { partCode: createDto.partCode } });
    if (existing) {
      throw new BusinessException(ErrorCode.VALIDATION_ERROR, '备件编码已存在');
    }

    const part = this.sparePartRepository.create(createDto);
    return this.sparePartRepository.save(part);
  }

  async findAllParts(queryDto: QuerySparePartDto): Promise<PaginatedResult<SparePart>> {
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

    return createPaginatedResult(data, total, page, limit);
  }

  async findOnePart(id: string): Promise<SparePart> {
    const part = await this.sparePartRepository.findOne({ where: { id } });
    if (!part) {
      throw new BusinessException(ErrorCode.PART_NOT_FOUND, '备件不存在');
    }
    return part;
  }

  async updatePart(id: string, updateDto: UpdateSparePartDto): Promise<SparePart> {
    const part = await this.findOnePart(id);
    Object.assign(part, updateDto);
    return this.sparePartRepository.save(part);
  }

  async deletePart(id: string): Promise<void> {
    const part = await this.findOnePart(id);
    await this.sparePartRepository.remove(part);
  }

  async requestPart(createDto: CreatePartUsageDto): Promise<PartUsage> {
    return this.dataSource.transaction(async (manager) => {
      const workOrder = await manager.findOne(WorkOrder, { where: { id: createDto.workOrderId } });
      if (!workOrder) {
        throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
      }

      const sparePart = await manager.findOne(SparePart, { where: { id: createDto.sparePartId } });
      if (!sparePart) {
        throw new BusinessException(ErrorCode.PART_NOT_FOUND, '备件不存在');
      }

      const partUsage = manager.create(PartUsage, {
        ...createDto,
        unitPrice: sparePart.unitPrice,
        totalPrice: sparePart.unitPrice * createDto.quantity,
        status: PartRequestStatus.PENDING,
      });

      const saved = await manager.save(partUsage);

      if (workOrder.status === WorkOrderStatus.DOWNTIME_CONFIRMED) {
        workOrder.status = WorkOrderStatus.PART_REQUESTED;
        await manager.save(workOrder);
      }

      return this.findOneUsage(saved.id);
    });
  }

  async approvePartUsage(id: string, approveDto: ApprovePartUsageDto): Promise<PartUsage> {
    return this.dataSource.transaction(async (manager) => {
      const partUsage = await manager.findOne(PartUsage, { where: { id } });
      if (!partUsage) {
        throw new BusinessException(ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
      }

      if (partUsage.status !== PartRequestStatus.PENDING) {
        throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, '当前状态不允许审批');
      }

      const sparePart = await manager.findOne(SparePart, { where: { id: partUsage.sparePartId } });

      if (approveDto.status === PartRequestStatus.APPROVED) {
        if (sparePart.stockQuantity < partUsage.quantity) {
          throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, '库存不足');
        }
        sparePart.stockQuantity -= partUsage.quantity;
        await manager.save(sparePart);
      }

      partUsage.status = approveDto.status;
      partUsage.approvedById = approveDto.approvedById;
      partUsage.approvedAt = new Date();
      partUsage.approvalRemark = approveDto.approvalRemark;

      await manager.save(partUsage);

      if (approveDto.status === PartRequestStatus.APPROVED) {
        const workOrder = await manager.findOne(WorkOrder, { where: { id: partUsage.workOrderId } });
        if (workOrder.status === WorkOrderStatus.PART_REQUESTED) {
          workOrder.status = WorkOrderStatus.PART_APPROVED;
          await manager.save(workOrder);
        }
      }

      return this.findOneUsage(id);
    });
  }

  async receivePartUsage(id: string, receiveDto: ReceivePartUsageDto): Promise<PartUsage> {
    return this.dataSource.transaction(async (manager) => {
      const partUsage = await manager.findOne(PartUsage, { where: { id } });
      if (!partUsage) {
        throw new BusinessException(ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
      }

      if (partUsage.status !== PartRequestStatus.APPROVED) {
        throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, '当前状态不允许签收');
      }

      partUsage.status = PartRequestStatus.RECEIVED;
      partUsage.receivedById = receiveDto.receivedById;
      partUsage.receivedAt = new Date();

      await manager.save(partUsage);

      const workOrder = await manager.findOne(WorkOrder, { where: { id: partUsage.workOrderId } });
      if (workOrder.status === WorkOrderStatus.PART_APPROVED) {
        workOrder.status = WorkOrderStatus.PART_RECEIVED;
        await manager.save(workOrder);
      }

      return this.findOneUsage(id);
    });
  }

  async findAllUsages(queryDto: QueryPartUsageDto): Promise<PaginatedResult<PartUsage>> {
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

    return createPaginatedResult(data, total, page, limit);
  }

  async findOneUsage(id: string): Promise<PartUsage> {
    const usage = await this.partUsageRepository.findOne({
      where: { id },
      relations: ['sparePart', 'workOrder', 'requestedBy', 'approvedBy', 'receivedBy'],
    });

    if (!usage) {
      throw new BusinessException(ErrorCode.PART_USAGE_NOT_FOUND, '备件领用记录不存在');
    }

    return usage;
  }
}
