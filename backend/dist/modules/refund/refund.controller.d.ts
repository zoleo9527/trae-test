import { RefundService } from './refund.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';
import { QueryRefundDto } from './dto/query-refund.dto';
import { AddNegotiationDto } from './dto/add-negotiation.dto';
export declare class RefundController {
    private readonly refundService;
    constructor(refundService: RefundService);
    create(createDto: CreateRefundDto): Promise<import("./refund.entity").Refund>;
    findAll(query: QueryRefundDto): Promise<{
        data: import("./refund.entity").Refund[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./refund.entity").Refund>;
    updateStatus(id: string, updateDto: UpdateRefundStatusDto): Promise<import("./refund.entity").Refund>;
    addNegotiation(id: string, dto: AddNegotiationDto): Promise<import("./refund.entity").Refund>;
}
