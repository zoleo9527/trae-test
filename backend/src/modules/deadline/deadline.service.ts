import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Deadline } from './deadline.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeadlineService {
  constructor(
    @InjectRepository(Deadline)
    private readonly deadlineRepository: Repository<Deadline>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<Deadline>, operatorId: string, operatorName: string): Promise<Deadline> {
    const deadline = this.deadlineRepository.create({
      ...data,
      isCompleted: false,
      isOverdue: false,
      reminderCount: 0,
    });

    const saved = await this.deadlineRepository.save(deadline);

    await this.auditService.log(
      'Deadline',
      saved.id,
      'CREATE',
      null,
      saved,
      operatorId,
      operatorName,
      '创建截止日提醒',
    );

    return saved;
  }

  async findByWorkOrder(workOrderId: string): Promise<Deadline[]> {
    return this.deadlineRepository.find({
      where: { workOrderId },
      relations: ['assignee'],
      order: { dueDate: 'ASC' },
    });
  }

  async findUpcoming(days: number = 7): Promise<Deadline[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.deadlineRepository.find({
      where: {
        isCompleted: false,
        dueDate: LessThan(futureDate),
      },
      relations: ['assignee', 'workOrder', 'workOrder.student'],
      order: { dueDate: 'ASC' },
    });
  }

  async markComplete(id: string, operatorId: string, operatorName: string): Promise<Deadline> {
    const deadline = await this.deadlineRepository.findOne({ where: { id } });
    if (!deadline) return null;

    const oldValue = { ...deadline };
    deadline.isCompleted = true;
    deadline.completedAt = new Date();

    const saved = await this.deadlineRepository.save(deadline);

    await this.auditService.log(
      'Deadline',
      id,
      'COMPLETE',
      oldValue,
      saved,
      operatorId,
      operatorName,
      '截止日任务完成',
    );

    return saved;
  }

  async checkOverdue(): Promise<Deadline[]> {
    const now = new Date();
    const overdueDeadlines = await this.deadlineRepository.find({
      where: {
        isCompleted: false,
        isOverdue: false,
        dueDate: LessThan(now),
      },
      relations: ['assignee', 'workOrder', 'workOrder.student'],
    });

    for (const deadline of overdueDeadlines) {
      deadline.isOverdue = true;
      await this.deadlineRepository.save(deadline);
    }

    return overdueDeadlines;
  }

  async incrementReminder(id: string): Promise<Deadline> {
    const deadline = await this.deadlineRepository.findOne({ where: { id } });
    if (!deadline) return null;

    deadline.reminderCount += 1;
    deadline.lastReminderAt = new Date();
    return this.deadlineRepository.save(deadline);
  }
}
