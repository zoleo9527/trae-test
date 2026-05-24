import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Material } from './material.entity';
import { Consultant } from '../consultant/consultant.entity';

@Entity('material_versions')
export class MaterialVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  materialId: string;

  @ManyToOne(() => Material, material => material.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column()
  version: number;

  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  changeLog: string;

  @Column({ type: 'uuid' })
  uploadedBy: string;

  @ManyToOne(() => Consultant)
  @JoinColumn({ name: 'uploadedBy' })
  uploader: Consultant;

  @CreateDateColumn()
  createdAt: Date;
}
