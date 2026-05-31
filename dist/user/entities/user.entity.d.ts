import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';
import { ChangeOrder } from '../../change-order/entities/change-order.entity';
import { SignOff } from '../../sign-off/entities/sign-off.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
export declare class User extends BaseEntity {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: Role;
    phoneNumber?: string;
    department?: string;
    isActive: boolean;
    avatarUrl?: string;
    createdChangeOrders: ChangeOrder[];
    requestedSignOffs: SignOff[];
    signedSignOffs: SignOff[];
    auditLogs: AuditLog[];
}
