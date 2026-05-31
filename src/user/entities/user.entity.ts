import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.WORKER,
  })
  role: Role;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @OneToMany(() => ChangeOrder, (changeOrder) => changeOrder.createdBy)
  createdChangeOrders: ChangeOrder[];

  @OneToMany(() => SignOff, (signOff) => signOff.requestedBy)
  requestedSignOffs: SignOff[];

  @OneToMany(() => SignOff, (signOff) => signOff.signedBy)
  signedSignOffs: SignOff[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];
}
