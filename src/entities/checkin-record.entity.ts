import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CheckinType, CheckinStatus } from '../common/enums/checkin.enum';
import { Project } from './project.entity';
import { Person } from './person.entity';
import { Credential } from './credential.entity';

@Entity('checkin_records')
export class CheckinRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.checkinRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => Person, (person) => person.checkinRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column()
  personId: string;

  @ManyToOne(() => Credential, (credential) => credential.checkinRecords, { nullable: true })
  @JoinColumn({ name: 'credentialId' })
  credential: Credential;

  @Column({ nullable: true })
  credentialId: string;

  @Column({
    type: 'enum',
    enum: CheckinType,
  })
  type: CheckinType;

  @Column({
    type: 'enum',
    enum: CheckinStatus,
    default: CheckinStatus.NORMAL,
  })
  status: CheckinStatus;

  @Column({ type: 'timestamp' })
  checkinTime: Date;

  @Column({ nullable: true })
  checkinPoint: string;

  @Column({ nullable: true })
  temperature: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
