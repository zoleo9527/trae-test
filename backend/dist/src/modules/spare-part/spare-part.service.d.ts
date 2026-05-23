import { Repository, DataSource } from 'typeorm';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage } from '../../entities/part-usage.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { CreateSparePartDto, UpdateSparePartDto, QuerySparePartDto, CreatePartUsageDto, ApprovePartUsageDto, ReceivePartUsageDto, QueryPartUsageDto } from './dto/spare-part.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class SparePartService {
    private sparePartRepository;
    private partUsageRepository;
    private workOrderRepository;
    private dataSource;
    constructor(sparePartRepository: Repository<SparePart>, partUsageRepository: Repository<PartUsage>, workOrderRepository: Repository<WorkOrder>, dataSource: DataSource);
    createPart(createDto: CreateSparePartDto): Promise<SparePart>;
    findAllParts(queryDto: QuerySparePartDto): Promise<PaginatedResult<SparePart>>;
    findOnePart(id: string): Promise<SparePart>;
    updatePart(id: string, updateDto: UpdateSparePartDto): Promise<SparePart>;
    deletePart(id: string): Promise<void>;
    requestPart(createDto: CreatePartUsageDto): Promise<PartUsage>;
    approvePartUsage(id: string, approveDto: ApprovePartUsageDto): Promise<PartUsage>;
    receivePartUsage(id: string, receiveDto: ReceivePartUsageDto): Promise<PartUsage>;
    findAllUsages(queryDto: QueryPartUsageDto): Promise<PaginatedResult<PartUsage>>;
    findOneUsage(id: string): Promise<PartUsage>;
}
