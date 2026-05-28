import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  building: string;

  @Column({ name: 'floor_number' })
  floorNumber: number;

  @Column({ name: 'bed_count' })
  bedCount: number;

  @Column({ name: 'gender_type' })
  genderType: string;

  @Column({ type: 'simple-array', nullable: true })
  beds: string[];

  @Column({ type: 'simple-json', nullable: true })
  assignments: Record<number, string>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
