import { SparePartService } from './spare-part.service';
import { CreateSparePartDto, UpdateSparePartDto, QuerySparePartDto, CreatePartUsageDto, ApprovePartUsageDto, ReceivePartUsageDto, QueryPartUsageDto } from './dto/spare-part.dto';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage } from '../../entities/part-usage.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class SparePartController {
    private readonly sparePartService;
    constructor(sparePartService: SparePartService);
    createPart(createDto: CreateSparePartDto): Promise<SparePart>;
    findAllParts(queryDto: QuerySparePartDto): Promise<PaginatedResult<SparePart>>;
    findOnePart(id: string): Promise<SparePart>;
    updatePart(id: string, updateDto: UpdateSparePartDto): Promise<SparePart>;
    deletePart(id: string): Promise<void>;
}
export declare class PartUsageController {
    private readonly sparePartService;
    constructor(sparePartService: SparePartService);
    requestPart(createDto: CreatePartUsageDto): Promise<PartUsage>;
    findAllUsages(queryDto: QueryPartUsageDto): Promise<PaginatedResult<PartUsage>>;
    findOneUsage(id: string): Promise<PartUsage>;
    approve(id: string, approveDto: ApprovePartUsageDto): Promise<PartUsage>;
    receive(id: string, receiveDto: ReceivePartUsageDto): Promise<PartUsage>;
}
