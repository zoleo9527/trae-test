import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';

@Entity('daily_reports')
export class DailyReport extends BaseEntity {
  @Column({ name: 'report_date', type: 'date' })
  reportDate: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'project_name' })
  projectName: string;

  @Column({ name: 'construction_site', nullable: true })
  constructionSite?: string;

  @Column({ name: 'team_name', nullable: true })
  teamName?: string;

  @Column({ type: 'int', name: 'worker_count', default: 0 })
  workerCount: number;

  @Column({ type: 'decimal', name: 'work_hours', precision: 8, scale: 2, default: 0 })
  workHours: number;

  @Column({ type: 'text', name: 'work_content' })
  workContent: string;

  @Column({ type: 'text', name: 'progress_status', nullable: true })
  progressStatus?: string;

  @Column({ type: 'text', name: 'quality_issues', nullable: true })
  qualityIssues?: string;

  @Column({ type: 'text', name: 'safety_issues', nullable: true })
  safetyIssues?: string;

  @Column({ type: 'text', name: 'materials_used', nullable: true })
  materialsUsed?: string;

  @Column({ type: 'text', name: 'equipment_used', nullable: true })
  equipmentUsed?: string;

  @Column({ type: 'text', name: 'next_day_plan', nullable: true })
  nextDayPlan?: string;

  @Column({ type: 'text', name: 'problems_encountered', nullable: true })
  problemsEncountered?: string;

  @Column({ type: 'text', name: 'weather_condition', nullable: true })
  weatherCondition?: string;

  @Column({ name: 'change_order_id', nullable: true })
  changeOrderId?: string;

  @ManyToOne(() => ChangeOrder, (changeOrder) => changeOrder.dailyReports, { nullable: true })
  @JoinColumn({ name: 'change_order_id' })
  changeOrder?: ChangeOrder;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => SignOff, (signOff) => signOff.dailyReport)
  signOffs: SignOff[];

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
