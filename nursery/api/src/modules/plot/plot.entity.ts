import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('plots')
export class Plot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'location', length: 200, nullable: true })
  location: string;

  @Column({ name: 'variety', length: 100, nullable: true })
  variety: string;

  @Column({ name: 'specification', length: 100, nullable: true })
  specification: string;

  @Column({ name: 'quantity', nullable: true })
  quantity: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @Column({ name: 'inspector_id' })
  inspectorId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
