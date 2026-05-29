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
import { PersonType } from '../common/enums/checkin.enum';
import { Supplier } from './supplier.entity';
import { Credential } from './credential.entity';
import { CheckinRecord } from './checkin-record.entity';

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  idCardNo: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PersonType,
    default: PersonType.STAFF,
  })
  type: PersonType;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'timestamp', nullable: true })
  birthDate: Date;

  @ManyToOne(() => Supplier, (supplier) => supplier.projects, { nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplierId: string;

  @Column({ nullable: true })
  position: string;

  @Column({ type: 'jsonb', nullable: true })
  qualificationFiles: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Credential, (credential) => credential.person)
  credentials: Credential[];

  @OneToMany(() => CheckinRecord, (checkin) => checkin.person)
  checkinRecords: CheckinRecord[];
}
