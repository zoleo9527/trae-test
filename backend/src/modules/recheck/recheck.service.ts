import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

      if (complaint.status !== 'pending' && complaint.status !== 'rechecking') {
        throw new BadRequestException('当前状态不允许登记复检');
      }

      const existingRechecks = await queryRunner.manager.find(Recheck, {
        where: { complaintId: data.complaintId },
      });

      const recheck = queryRunner.manager.create(Recheck, {
        ...data,
        operatorId: userId,
        recheckTime: data.recheckTime || new Date(),
      });
      await queryRunner.manager.save(recheck);

      const oldStatus = complaint.status;

      if (complaint.status === 'pending' || complaint.status === 'rechecking') {
        complaint.status = 'compensating';
        await queryRunner.manager.save(complaint);

        const statusLog = queryRunner.manager.create(StatusLog, {
          complaintId: data.complaintId,
          fromStatus: oldStatus,
          toStatus: 'compensating',
          remark: existingRechecks.length > 0
            ? `待赔付审批（第${existingRechecks.length + 1}次复检）`
            : '待赔付审批',
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
