import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { QueryTransferDto } from './dto/query-transfer.dto';
export declare class TransferController {
    private readonly transferService;
    constructor(transferService: TransferService);
    create(createDto: CreateTransferDto): Promise<import("./transfer.entity").Transfer>;
    findAll(query: QueryTransferDto): Promise<{
        data: import("./transfer.entity").Transfer[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./transfer.entity").Transfer>;
    updateStatus(id: string, updateDto: UpdateTransferStatusDto): Promise<import("./transfer.entity").Transfer>;
    updateHandover(id: string, data: {
        handoverContent?: string;
        keyNotes?: string;
        pendingItems?: string;
    }): Promise<import("./transfer.entity").Transfer>;
}
