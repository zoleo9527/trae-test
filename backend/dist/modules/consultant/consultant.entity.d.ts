import { Role } from '../../common/enums/role.enum';
export declare class Consultant {
    id: string;
    name: string;
    username: string;
    role: Role;
    phone: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
