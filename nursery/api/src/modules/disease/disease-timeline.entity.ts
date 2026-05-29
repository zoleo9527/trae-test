import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Disease } from './disease.entity';

@Entity('disease_timelines')
export class DiseaseTimeline {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Disease, (disease) => disease.timelines)
  @JoinColumn({ name: 'disease_id' })
  disease: Disease;

  @Column({ name: 'disease_id' })
  diseaseId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ name: 'operator_id' })
  operatorId: number;

  @Column({ name: 'action', length: 100 })
  action: string;

  @Column({ name: 'content', type: 'text', nullable: true })
  content: string;

  @Column({ name: 'operated_at', type: 'timestamp' })
  operatedAt: Date;
}
