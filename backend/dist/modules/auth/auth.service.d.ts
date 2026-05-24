import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
export interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        username: string;
        realName: string;
        role: string;
        phone: string;
    };
}
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    validateUser(username: string, password: string): Promise<User>;
    login(username: string, password: string): Promise<LoginResponse>;
}
