import { UserRole } from '../user.entity';
export declare class CreateUserDto {
    name: string;
    role: UserRole;
    phone?: string;
}
export declare class QueryUserDto {
    role?: UserRole;
    name?: string;
}
