import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Disease } from '../disease/disease.entity';
import { Plot } from '../plot/plot.entity';
import { User } from '../user/user.entity';

export enum InspectionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plot)
  @JoinColumn({ name: 'plot_id' })
  plot: Plot;

  @Column({ name: 'plot_id' })
  plotId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @Column({ name: 'inspector_id' })
  inspectorId: number;

  @Column({ name: 'growth_status', length: 50, nullable: true })
  growthStatus: string;

  @Column({ name: 'soil_condition', length: 50, nullable: true })
  soilCondition: string;

  @Column({ name: 'moisture_condition', length: 50, nullable: true })
  moistureCondition: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'status', type: 'enum', enum: InspectionStatus, default: InspectionStatus.PENDING })
  status: InspectionStatus;

  @Column({ name: 'inspection_date', type: 'date' })
  inspectionDate: string;

  @Column({ name: 'has_disease', default: false })
  hasDisease: boolean;

  @OneToOne(() => Disease, (disease) => disease.inspection)
  disease: Disease;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
