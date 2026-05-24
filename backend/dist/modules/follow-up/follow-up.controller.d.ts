import { FollowUpService, CreateFollowUpDto, CompleteFollowUpDto } from './follow-up.service';
import { User, FollowUpStatus, FollowUpType } from '../../database/entities';
export declare class FollowUpController {
    private followUpService;
    constructor(followUpService: FollowUpService);
    create(dto: CreateFollowUpDto, user: User): Promise<import("../../database/entities").FollowUp>;
    findAll(status?: FollowUpStatus, type?: FollowUpType, memberId?: string, assignedTo?: string, page?: number, limit?: number): Promise<{
        data: import("../../database/entities").FollowUp[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(): Promise<any>;
    findOne(id: string): Promise<import("../../database/entities").FollowUp>;
    complete(id: string, dto: CompleteFollowUpDto, user: User): Promise<import("../../database/entities").FollowUp>;
}
