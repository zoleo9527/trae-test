import { Repository } from 'typeorm';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { CreateDowntimeDto, UpdateDowntimeDto, ConfirmDowntimeDto, QueryDowntimeDto } from './dto/downtime.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class DowntimeService {
    private downtimeRepository;
    private workOrderRepository;
    constructor(downtimeRepository: Repository<DowntimeRecord>, workOrderRepository: Repository<WorkOrder>);
    create(createDto: CreateDowntimeDto): Promise<DowntimeRecord>;
    findAll(queryDto: QueryDowntimeDto): Promise<PaginatedResult<DowntimeRecord>>;
    findOne(id: string): Promise<DowntimeRecord>;
    update(id: string, updateDto: UpdateDowntimeDto): Promise<DowntimeRecord>;
    confirm(id: string, confirmDto: ConfirmDowntimeDto): Promise<DowntimeRecord>;
    delete(id: string): Promise<void>;
    private updateWorkOrderDowntime;
}
