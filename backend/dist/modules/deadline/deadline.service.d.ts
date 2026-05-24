import { Repository } from 'typeorm';
import { Deadline } from './deadline.entity';
import { AuditService } from '../audit/audit.service';
export declare class DeadlineService {
    private readonly deadlineRepository;
    private readonly auditService;
    constructor(deadlineRepository: Repository<Deadline>, auditService: AuditService);
    create(data: Partial<Deadline>, operatorId: string, operatorName: string): Promise<Deadline>;
    findByWorkOrder(workOrderId: string): Promise<Deadline[]>;
    findUpcoming(days?: number): Promise<Deadline[]>;
    markComplete(id: string, operatorId: string, operatorName: string): Promise<Deadline>;
    checkOverdue(): Promise<Deadline[]>;
    incrementReminder(id: string): Promise<Deadline>;
}
