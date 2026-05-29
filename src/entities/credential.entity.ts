import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CredentialType, CredentialStatus } from '../common/enums/credential.enum';
import { Project } from './project.entity';
import { Person } from './person.entity';
import { CheckinRecord } from './checkin-record.entity';
import { StatusLog } from './status-log.entity';

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  credentialNo: string;

  @ManyToOne(() => Project, (project) => project.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => Person, (person) => person.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Column()
  personId: string;

  @Column({
    type: 'enum',
    enum: CredentialType,
  })
  type: CredentialType;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
    default: CredentialStatus.DRAFT,
  })
  status: CredentialStatus;

  @Column({ type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  validTo: Date;

  @Column({ nullable: true })
  workArea: string;

  @Column({ nullable: true })
  accessLevel: string;

  @Column({ type: 'jsonb', nullable: true })
  applicationFiles: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reviewRemark: string;

  @Column({ nullable: true })
  reviewer: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  issuer: string;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date;

  @Column({ nullable: true })
  receiver: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CheckinRecord, (checkin) => checkin.credential)
  checkinRecords: CheckinRecord[];

  @OneToMany(() => StatusLog, (log) => log.credential)
  statusLogs: StatusLog[];
}
