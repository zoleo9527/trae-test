import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';
import { CreateDowntimeDto, UpdateDowntimeDto, ConfirmDowntimeDto, QueryDowntimeDto } from './dto/downtime.dto';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class DowntimeService {
  constructor(
    @InjectRepository(DowntimeRecord)
    private downtimeRepository: Repository<DowntimeRecord>,
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
  ) {}

  async create(createDto: CreateDowntimeDto): Promise<DowntimeRecord> {
    const workOrder = await this.workOrderRepository.findOne({ where: { id: createDto.workOrderId } });
    if (!workOrder) {
      throw new BusinessException(ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
    }

    const downtime = this.downtimeRepository.create(createDto);
    return this.downtimeRepository.save(downtime);
  }

  async findAll(queryDto: QueryDowntimeDto): Promise<PaginatedResult<DowntimeRecord>> {
    const { page, limit, sortBy = 'createdAt', sortOrder, workOrderId, isConfirmed, startDate, endDate } = queryDto;

    const queryBuilder = this.downtimeRepository.createQueryBuilder('downtime')
      .leftJoinAndSelect('downtime.workOrder', 'workOrder')
      .leftJoinAndSelect('downtime.confirmedBy', 'confirmedBy');

    if (workOrderId) {
      queryBuilder.andWhere('downtime.workOrderId = :workOrderId', { workOrderId });
    }

    if (isConfirmed !== undefined) {
      queryBuilder.andWhere('downtime.isConfirmed = :isConfirmed', { isConfirmed });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('downtime.startTime BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    queryBuilder.orderBy(`downtime.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<DowntimeRecord> {
    const downtime = await this.downtimeRepository.findOne({
      where: { id },
      relations: ['workOrder', 'confirmedBy'],
    });

    if (!downtime) {
      throw new BusinessException(ErrorCode.DOWNTIME_NOT_FOUND, '停机记录不存在');
    }

    return downtime;
  }

  async update(id: string, updateDto: UpdateDowntimeDto): Promise<DowntimeRecord> {
    const downtime = await this.findOne(id);
    
    if (updateDto.startTime) downtime.startTime = updateDto.startTime;
    if (updateDto.endTime !== undefined) {
      downtime.endTime = updateDto.endTime;
      if (updateDto.endTime) {
        const duration = Math.floor((updateDto.endTime.getTime() - downtime.startTime.getTime()) / (1000 * 60));
        downtime.durationMinutes = duration;
      }
    }
    if (updateDto.reason) downtime.reason = updateDto.reason;

    return this.downtimeRepository.save(downtime);
  }

  async confirm(id: string, confirmDto: ConfirmDowntimeDto): Promise<DowntimeRecord> {
    const downtime = await this.findOne(id);
    
    downtime.isConfirmed = true;
    downtime.confirmedById = confirmDto.confirmedById;
    downtime.confirmedAt = new Date();

    const saved = await this.downtimeRepository.save(downtime);
    await this.updateWorkOrderDowntime(downtime.workOrderId);
    
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const downtime = await this.findOne(id);
    const workOrderId = downtime.workOrderId;
    await this.downtimeRepository.remove(downtime);
    await this.updateWorkOrderDowntime(workOrderId);
  }

  private async updateWorkOrderDowntime(workOrderId: string): Promise<void> {
    const records = await this.downtimeRepository.find({
      where: { workOrderId, isConfirmed: true },
    });

    const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
    
    await this.workOrderRepository.update(workOrderId, {
      totalDowntimeMinutes: totalMinutes,
    });
  }
}
