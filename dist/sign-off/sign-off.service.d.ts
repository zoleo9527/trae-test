import { Repository, DataSource } from 'typeorm';
import { SignOff } from './entities/sign-off.entity';
import { ChangeOrder } from '../change-order/entities/change-order.entity';
import { CreateSignOffDto } from './dto/create-sign-off.dto';
import { ActionSignOffDto } from './dto/action-sign-off.dto';
import { User } from '../user/entities/user.entity';
import { SignOffStatus } from '../common/enums/sign-off.enum';
import { AuditService } from '../audit/audit.service';
export declare class SignOffService {
    private signOffRepository;
    private changeOrderRepository;
    private dataSource;
    private auditService;
    constructor(signOffRepository: Repository<SignOff>, changeOrderRepository: Repository<ChangeOrder>, dataSource: DataSource, auditService: AuditService);
    create(createDto: CreateSignOffDto, user: User): Promise<SignOff>;
    findAll(page?: number, limit?: number, filters?: {
        status?: SignOffStatus;
        signOffType?: string;
    }): Promise<{
        data: SignOff[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<SignOff>;
    private canUserSign;
    sign(id: string, actionDto: ActionSignOffDto, user: User): Promise<SignOff>;
    private handleChangeOrderSignOffApproval;
    reject(id: string, actionDto: ActionSignOffDto, user: User): Promise<SignOff>;
    findByChangeOrder(changeOrderId: string): Promise<SignOff[]>;
    getPendingForUser(user: User): Promise<SignOff[]>;
    getMySigned(user: User): Promise<SignOff[]>;
    getMyRequested(user: User): Promise<SignOff[]>;
}
