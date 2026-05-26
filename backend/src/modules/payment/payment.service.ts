import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../../common/entities/payment.entity';
import { Compensation } from '../../common/entities/compensation.entity';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Compensation)
    private compensationRepository: Repository<Compensation>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    private dataSource: DataSource,
  ) {}

  async findAll(query: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 10 } = query;
    
    const [list, total] = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.compensation', 'compensation')
      .leftJoinAndSelect('compensation.complaint', 'complaint')
      .leftJoinAndSelect('payment.recorder', 'recorder')
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findByCompensationId(compensationId: string) {
    return this.paymentRepository.find({
      where: { compensationId },
      relations: ['recorder'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Payment> & { compensationId: string }, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const compensation = await queryRunner.manager.findOne(Compensation, {
        where: { id: data.compensationId },
        relations: ['complaint'],
      });
      
      if (!compensation) {
        throw new NotFoundException('赔付记录不存在');
      }

      const payment = queryRunner.manager.create(Payment, {
        ...data,
        recordedBy: userId,
        paymentDate: data.paymentDate || new Date(),
      });
      await queryRunner.manager.save(payment);

      const complaint = compensation.complaint;
      if (complaint && complaint.status !== 'completed') {
        const oldStatus = complaint.status;
        complaint.status = 'completed';
        await queryRunner.manager.save(complaint);

        const statusLog = queryRunner.manager.create(StatusLog, {
          complaintId: complaint.id,
          fromStatus: oldStatus,
          toStatus: 'completed',
          remark: '已完成',
          operatorId: userId,
        });
        await queryRunner.manager.save(statusLog);
      }

      await queryRunner.commitTransaction();
      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
