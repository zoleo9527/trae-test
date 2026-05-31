import { Role } from '../../common/enums/role.enum';
export declare class CreateUserDto {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: Role;
    phoneNumber?: string;
    department?: string;
}
