import { CreateUserDto, QueryUserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(query: QueryUserDto): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(dto: CreateUserDto): Promise<User>;
}
