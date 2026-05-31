import { DailyReportService } from './daily-report.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
export declare class DailyReportController {
    private readonly dailyReportService;
    constructor(dailyReportService: DailyReportService);
    create(req: any, createDailyReportDto: CreateDailyReportDto): Promise<import("./entities/daily-report.entity").DailyReport>;
    findAll(page?: number, limit?: number, projectId?: string, startDate?: string, endDate?: string): Promise<{
        data: import("./entities/daily-report.entity").DailyReport[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./entities/daily-report.entity").DailyReport>;
    update(req: any, id: string, updateDailyReportDto: UpdateDailyReportDto): Promise<import("./entities/daily-report.entity").DailyReport>;
    findByChangeOrder(changeOrderId: string): Promise<import("./entities/daily-report.entity").DailyReport[]>;
}
