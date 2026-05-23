import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PartUsage } from './part-usage.entity';

@Entity('spare_parts')
export class SparePart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  partCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  specification: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ default: 0 })
  stockQuantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => PartUsage, partUsage => partUsage.sparePart)
  usages: PartUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
