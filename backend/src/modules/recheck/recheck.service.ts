import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recheck } from '../../common/entities/recheck.entity';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Injectable()
export class RecheckService {
  constructor(
    @InjectRepository(Recheck)
    private recheckRepository: Repository<Recheck>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
    private dataSource: DataSource,
  ) {}

  async findByComplaintId(complaintId: string) {
    return this.recheckRepository.find({
      where: { complaintId },
      relations: ['operator'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Recheck> & { complaintId: string }, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const complaint = await queryRunner.manager.findOne(Complaint, {
        where: { id: data.complaintId },
      });
      
      if (!complaint) {
        throw new NotFoundException('客诉记录不存在');
      }

      const recheck = queryRunner.manager.create(Recheck, {
        ...data,
        operatorId: userId,
        recheckTime: data.recheckTime || new Date(),
      });
      await queryRunner.manager.save(recheck);

      if (complaint.status === 'pending' || complaint.status === 'rechecking') {
        complaint.status = 'compensating';
        await queryRunner.manager.save(complaint);

        const statusLog = queryRunner.manager.create(StatusLog, {
          complaintId: data.complaintId,
          fromStatus: complaint.status === 'pending' ? 'pending' : 'rechecking',
          toStatus: 'compensating',
          remark: '复检完成，进入赔付审批',
          operatorId: userId,
        });
        await queryRunner.manager.save(statusLog);
      }

      await queryRunner.commitTransaction();
      return recheck;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
