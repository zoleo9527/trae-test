import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(data: Partial<User>): Promise<User>;
    findAll(queryDto: PaginationDto & {
        role?: UserRole;
        keyword?: string;
    }): Promise<PaginatedResult<User>>;
    findOne(id: string): Promise<User>;
    findByRole(role: UserRole): Promise<User[]>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
}
