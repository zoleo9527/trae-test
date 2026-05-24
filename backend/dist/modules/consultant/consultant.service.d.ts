import { Repository } from 'typeorm';
import { Consultant } from './consultant.entity';
import { Role } from '../../common/enums/role.enum';
export declare class ConsultantService {
    private readonly consultantRepository;
    constructor(consultantRepository: Repository<Consultant>);
    create(data: Partial<Consultant>): Promise<Consultant>;
    findAll(role?: Role): Promise<Consultant[]>;
    findOne(id: string): Promise<Consultant>;
    findByUsername(username: string): Promise<Consultant>;
}
