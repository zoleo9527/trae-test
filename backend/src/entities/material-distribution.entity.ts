import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Camper } from './camper.entity';
import { Material } from './material.entity';

@Entity('material_distributions')
export class MaterialDistribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'camper_id' })
  camperId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column()
  quantity: number;

  @Column({ name: 'distributed_by' })
  distributedBy: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ default: 'distributed' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Camper, camper => camper.materialDistributions)
  @JoinColumn({ name: 'camper_id' })
  camper: Camper;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
