import { Repository } from 'typeorm';
import { DailyReport } from './entities/daily-report.entity';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { User } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
export declare class DailyReportService {
    private dailyReportRepository;
    private auditService;
    constructor(dailyReportRepository: Repository<DailyReport>, auditService: AuditService);
    create(createDto: CreateDailyReportDto, user: User): Promise<DailyReport>;
    findAll(page?: number, limit?: number, filters?: {
        projectId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        data: DailyReport[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<DailyReport>;
    update(id: string, updateDto: UpdateDailyReportDto, user: User): Promise<DailyReport>;
    findByChangeOrder(changeOrderId: string): Promise<DailyReport[]>;
}
