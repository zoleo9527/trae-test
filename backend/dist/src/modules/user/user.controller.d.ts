import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(data: Partial<User>): Promise<User>;
    findAll(queryDto: PaginationDto & {
        role?: UserRole;
        keyword?: string;
    }): Promise<PaginatedResult<User>>;
    findByRole(role: UserRole): Promise<User[]>;
    findOne(id: string): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
}
