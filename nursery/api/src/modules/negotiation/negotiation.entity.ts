import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Disease } from '../disease/disease.entity';
import { User } from '../user/user.entity';

export enum NegotiationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  CONFIRMED = 'confirmed',
  CLOSED = 'closed',
}

@Entity('negotiations')
export class Negotiation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Disease, (disease) => disease.negotiations)
  @JoinColumn({ name: 'disease_id' })
  disease: Disease;

  @Column({ name: 'disease_id' })
  diseaseId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiator_id' })
  initiator: User;

  @Column({ name: 'initiator_id' })
  initiatorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'confirmed_by_id' })
  confirmedBy: User;

  @Column({ name: 'confirmed_by_id', nullable: true })
  confirmedById: number;

  @Column({ name: 'sales_opinion', type: 'text', nullable: true })
  salesOpinion: string;

  @Column({ name: 'base_opinion', type: 'text', nullable: true })
  baseOpinion: string;

  @Column({ name: 'replant_quantity', nullable: true })
  replantQuantity: number;

  @Column({ name: 'replant_variety', length: 100, nullable: true })
  replantVariety: string;

  @Column({ name: 'replant_date', type: 'date', nullable: true })
  replantDate: string;

  @Column({ name: 'status', type: 'enum', enum: NegotiationStatus, default: NegotiationStatus.PENDING })
  status: NegotiationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
