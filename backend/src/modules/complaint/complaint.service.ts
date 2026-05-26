import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Complaint, ComplaintStatus } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';
import { Recheck } from '../../common/entities/recheck.entity';
import { Compensation } from '../../common/entities/compensation.entity';
import { Payment } from '../../common/entities/payment.entity';

@Injectable()
export class ComplaintService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    @InjectRepository(StatusLog)
    private statusLogRepository: Repository<StatusLog>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: {
    status?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) {
    const { status, page = 1, pageSize = 10, keyword } = query;
    
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.creator', 'creator')
      .leftJoinAndSelect('complaint.rechecks', 'rechecks')
      .leftJoinAndSelect('rechecks.operator', 'recheckOperator')
      .leftJoinAndSelect('complaint.compensations', 'compensations')
      .leftJoinAndSelect('compensations.approver', 'approver')
      .leftJoinAndSelect('complaint.statusLogs', 'statusLogs')
      .leftJoinAndSelect('statusLogs.operator', 'operator')
      .orderBy('complaint.createdAt', 'DESC')
      .addOrderBy('statusLogs.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('complaint.status = :status', { status });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(complaint.customerName LIKE :keyword OR complaint.weightNoteNo LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOne(id: string) {
    const complaint = await this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.creator', 'creator')
      .leftJoinAndSelect('complaint.rechecks', 'rechecks')
      .leftJoinAndSelect('rechecks.operator', 'recheckOperator')
      .leftJoinAndSelect('complaint.compensations', 'compensations')
      .leftJoinAndSelect('compensations.approver', 'approver')
      .leftJoinAndSelect('compensations.payments', 'payments')
      .leftJoinAndSelect('payments.recorder', 'recorder')
      .leftJoinAndSelect('complaint.statusLogs', 'statusLogs')
      .leftJoinAndSelect('statusLogs.operator', 'operator')
      .leftJoinAndSelect('complaint.evidences', 'evidences')
      .leftJoinAndSelect('evidences.uploader', 'uploader')
      .where('complaint.id = :id', { id })
      .orderBy('statusLogs.createdAt', 'DESC')
      .addOrderBy('rechecks.createdAt', 'DESC')
      .addOrderBy('evidences.createdAt', 'DESC')
      .getOne();

    if (!complaint) {
      throw new NotFoundException('客诉记录不存在');
    }

    return complaint;
  }

  async create(data: Partial<Complaint>, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const complaint = queryRunner.manager.create(Complaint, {
        ...data,
        createdBy: userId,
        status: 'pending',
      });
      await queryRunner.manager.save(complaint);

      const statusLog = queryRunner.manager.create(StatusLog, {
        complaintId: complaint.id,
        fromStatus: null,
        toStatus: 'pending',
        remark: '客诉已登记',
        operatorId: userId,
      });
      await queryRunner.manager.save(statusLog);

      await queryRunner.commitTransaction();
      return this.findOne(complaint.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: ComplaintStatus, userId: string, remark?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const complaint = await queryRunner.manager.findOne(Complaint, { where: { id } });
      if (!complaint) {
        throw new NotFoundException('客诉记录不存在');
      }

      const oldStatus = complaint.status;
      complaint.status = status;
      await queryRunner.manager.save(complaint);

      const statusLog = queryRunner.manager.create(StatusLog, {
        complaintId: id,
        fromStatus: oldStatus,
        toStatus: status,
        remark: remark || this.getStatusRemark(status),
        operatorId: userId,
      });
      await queryRunner.manager.save(statusLog);

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getStatusRemark(status: ComplaintStatus): string {
    const remarks: Record<ComplaintStatus, string> = {
      pending: '客诉已登记',
      rechecking: '已安排复检',
      compensating: '复检完成，进入赔付审批',
      payment_pending: '赔付已批准，等待回款',
      completed: '回款完成，案件结案',
      rejected: '客诉已驳回',
    };
    return remarks[status] || '状态已更新';
  }

  async batchUpdate(ids: string[], action: string, userId: string) {
    const results = { success: 0, failed: 0 };
    
    for (const id of ids) {
      try {
        let newStatus: ComplaintStatus | null = null;
        
        switch (action) {
          case 'recheck':
            newStatus = 'rechecking';
            break;
          case 'approve':
            newStatus = 'completed';
            break;
          case 'reject':
            newStatus = 'rejected';
            break;
          case 'compensate':
            newStatus = 'compensating';
            break;
        }

        if (newStatus) {
          await this.updateStatus(id, newStatus, userId);
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  }

  async getStatistics() {
    const statusCounts = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('complaint.status')
      .getRawMany();

    const total = await this.complaintRepository.count();
    
    return {
      total,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
