import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Compensation } from '../../common/entities/compensation.entity';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Injectable()
export class CompensationService {
  constructor(
    @InjectRepository(Compensation)
    private compensationRepository: Repository<Compensation>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 10 } = query;
    
    const queryBuilder = this.compensationRepository
      .createQueryBuilder('compensation')
      .leftJoinAndSelect('compensation.complaint', 'complaint')
      .leftJoinAndSelect('compensation.approver', 'approver')
      .leftJoinAndSelect('compensation.payments', 'payments')
      .orderBy('compensation.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('compensation.status = :status', { status });
    }

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findByComplaintId(complaintId: string) {
    return this.compensationRepository.find({
      where: { complaintId },
      relations: ['approver', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Compensation> & { complaintId: string }) {
    const compensation = this.compensationRepository.create({
      ...data,
      status: 'pending',
    });
    return this.compensationRepository.save(compensation);
  }

  async approve(id: string, userId: string, remark?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compensation = await queryRunner.manager.findOne(Compensation, {
        where: { id },
        relations: ['complaint'],
      });
      
      if (!compensation) {
        throw new NotFoundException('赔付记录不存在');
      }

      compensation.status = 'approved';
      compensation.approvedBy = userId;
      compensation.approvedAt = new Date();
      compensation.remark = remark || compensation.remark;
      await queryRunner.manager.save(compensation);

      const complaint = compensation.complaint;
      if (complaint && complaint.status !== 'payment_pending' && complaint.status !== 'completed') {
        const oldStatus = complaint.status;
        complaint.status = 'payment_pending';
        await queryRunner.manager.save(complaint);

        const statusLog = queryRunner.manager.create(StatusLog, {
          complaintId: complaint.id,
          fromStatus: oldStatus,
          toStatus: 'payment_pending',
          remark: '赔付已批准，等待回款',
          operatorId: userId,
        });
        await queryRunner.manager.save(statusLog);
      }

      await queryRunner.commitTransaction();
      return compensation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reject(id: string, userId: string, remark?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compensation = await queryRunner.manager.findOne(Compensation, {
        where: { id },
        relations: ['complaint'],
      });
      
      if (!compensation) {
        throw new NotFoundException('赔付记录不存在');
      }

      compensation.status = 'rejected';
      compensation.approvedBy = userId;
      compensation.remark = remark || compensation.remark;
      await queryRunner.manager.save(compensation);

      const complaint = compensation.complaint;
      if (complaint) {
        const oldStatus = complaint.status;
        complaint.status = 'rejected';
        await queryRunner.manager.save(complaint);

        const statusLog = queryRunner.manager.create(StatusLog, {
          complaintId: complaint.id,
          fromStatus: oldStatus,
          toStatus: 'rejected',
          remark: '赔付申请被驳回',
          operatorId: userId,
        });
        await queryRunner.manager.save(statusLog);
      }

      await queryRunner.commitTransaction();
      return compensation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
