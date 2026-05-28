import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Camper } from './camper.entity';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'camper_id' })
  camperId: string;

  @Column()
  activity: string;

  @Column({ name: 'activity_date' })
  activityDate: Date;

  @Column({ name: 'checked_in', default: false })
  checkedIn: boolean;

  @Column({ name: 'checked_in_at', nullable: true })
  checkedInAt: Date;

  @Column({ name: 'checked_in_by', nullable: true })
  checkedInBy: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Camper, camper => camper.checkIns)
  @JoinColumn({ name: 'camper_id' })
  camper: Camper;
}
