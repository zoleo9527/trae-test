import { Repository, DataSource } from 'typeorm';
import { ChangeOrder } from './entities/change-order.entity';
import { ChangeOrderVersion } from './entities/change-order-version.entity';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { StatusTransitionDto } from './dto/status-transition.dto';
import { User } from '../user/entities/user.entity';
import { ChangeOrderStatus } from '../common/enums/change-order-status.enum';
import { AuditService } from '../audit/audit.service';
import { SignOff } from '../sign-off/entities/sign-off.entity';
export declare class ChangeOrderService {
    private changeOrderRepository;
    private versionRepository;
    private signOffRepository;
    private dataSource;
    private auditService;
    constructor(changeOrderRepository: Repository<ChangeOrder>, versionRepository: Repository<ChangeOrderVersion>, signOffRepository: Repository<SignOff>, dataSource: DataSource, auditService: AuditService);
    private generateOrderNumber;
    create(createDto: CreateChangeOrderDto, user: User): Promise<ChangeOrder>;
    findAll(page?: number, limit?: number, filters?: {
        status?: ChangeOrderStatus;
        projectId?: string;
        changeType?: string;
    }): Promise<{
        data: ChangeOrder[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<ChangeOrder>;
    update(id: string, updateDto: UpdateChangeOrderDto, user: User): Promise<ChangeOrder>;
    transitionStatus(id: string, transitionDto: StatusTransitionDto, user: User): Promise<ChangeOrder>;
    private autoGenerateSignOffs;
    private checkPendingSignOffs;
    private createVersion;
    private calculateChanges;
    getVersions(id: string): Promise<ChangeOrderVersion[]>;
    getVersion(id: string, versionNumber: number): Promise<ChangeOrderVersion>;
    getPendingForUser(user: User): Promise<ChangeOrder[]>;
    getRejectedForUser(user: User): Promise<ChangeOrder[]>;
    getNeedsReview(user: User): Promise<ChangeOrder[]>;
    getStatistics(): Promise<any>;
}
