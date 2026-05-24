import { DeadlineService } from './deadline.service';
export declare class DeadlineController {
    private readonly deadlineService;
    constructor(deadlineService: DeadlineService);
    create(data: any): Promise<import("./deadline.entity").Deadline>;
    findByWorkOrder(workOrderId: string): Promise<import("./deadline.entity").Deadline[]>;
    findUpcoming(days?: number): Promise<import("./deadline.entity").Deadline[]>;
    checkOverdue(): Promise<import("./deadline.entity").Deadline[]>;
    markComplete(id: string, data: any): Promise<import("./deadline.entity").Deadline>;
}
