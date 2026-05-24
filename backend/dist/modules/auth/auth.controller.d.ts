import { AuthService, LoginResponse } from './auth.service';
import { User } from '../../database/entities';
export declare class LoginDto {
    username: string;
    password: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponse>;
    getProfile(user: User): {
        id: string;
        username: string;
        realName: string;
        role: import("../../database/entities").UserRole;
        phone: string;
    };
}
