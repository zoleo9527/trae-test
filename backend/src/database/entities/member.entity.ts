import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { FollowUp } from './follow-up.entity';

export enum MemberLevel {
  NORMAL = 'normal',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

@Entity('members')
export class Member extends BaseEntity {
  @Column({ type: 'varchar', length: 50, name: 'member_no', unique: true })
  memberNo: string;

  @Column({ type: 'varchar', length: 50, name: 'real_name' })
  realName: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'date', name: 'birthday', nullable: true })
  birthday: Date;

  @Column({
    type: 'enum',
    enum: MemberLevel,
    default: MemberLevel.NORMAL,
  })
  level: MemberLevel;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_consumption' })
  totalConsumption: number;

  @Column({ type: 'int', default: 0, name: 'points' })
  points: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.member)
  workOrders: WorkOrder[];

  @OneToMany(() => FollowUp, (followUp) => followUp.member)
  followUps: FollowUp[];
}
