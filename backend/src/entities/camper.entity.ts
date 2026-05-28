import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CheckIn } from './check-in.entity';
import { MedicalReport } from './medical-report.entity';
import { MaterialDistribution } from './material-distribution.entity';
import { ResupplyRequest } from './resupply-request.entity';

@Entity('campers')
export class Camper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  gender: string;

  @Column()
  age: number;

  @Column({ name: 'id_card' })
  idCard: string;

  @Column({ name: 'parent_name' })
  parentName: string;

  @Column({ name: 'parent_phone' })
  parentPhone: string;

  @Column({ nullable: true })
  allergy: string;

  @Column({ nullable: true, name: 'medical_history' })
  medicalHistory: string;

  @Column({ name: 'room_id', nullable: true })
  roomId: string;

  @Column({ name: 'bed_number', nullable: true })
  bedNumber: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CheckIn, checkIn => checkIn.camper)
  checkIns: CheckIn[];

  @OneToMany(() => MedicalReport, report => report.camper)
  medicalReports: MedicalReport[];

  @OneToMany(() => MaterialDistribution, dist => dist.camper)
  materialDistributions: MaterialDistribution[];

  @OneToMany(() => ResupplyRequest, req => req.camper)
  resupplyRequests: ResupplyRequest[];
}
