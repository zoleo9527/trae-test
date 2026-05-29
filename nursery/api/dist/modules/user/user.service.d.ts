import { Repository } from 'typeorm';
import { CreateUserDto, QueryUserDto } from './dto/user.dto';
import { User, UserRole } from './user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findAll(query?: QueryUserDto): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(dto: CreateUserDto): Promise<User>;
    getByRole(role: UserRole): Promise<User[]>;
}
