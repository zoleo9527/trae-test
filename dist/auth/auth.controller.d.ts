import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            role: import("../common/enums/role.enum").Role;
            department: string;
        };
    } | {
        success: boolean;
        message: string;
    }>;
    getProfile(req: any): any;
}
