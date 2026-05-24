import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { ConfigService } from '@nestjs/config';
export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private userRepository;
    private configService;
    constructor(userRepository: Repository<User>, configService: ConfigService);
    validate(payload: JwtPayload): Promise<User>;
}
export {};
