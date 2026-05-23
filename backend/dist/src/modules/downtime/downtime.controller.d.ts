import { DowntimeService } from './downtime.service';
import { CreateDowntimeDto, UpdateDowntimeDto, ConfirmDowntimeDto, QueryDowntimeDto } from './dto/downtime.dto';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class DowntimeController {
    private readonly downtimeService;
    constructor(downtimeService: DowntimeService);
    create(createDto: CreateDowntimeDto): Promise<DowntimeRecord>;
    findAll(queryDto: QueryDowntimeDto): Promise<PaginatedResult<DowntimeRecord>>;
    findOne(id: string): Promise<DowntimeRecord>;
    update(id: string, updateDto: UpdateDowntimeDto): Promise<DowntimeRecord>;
    confirm(id: string, confirmDto: ConfirmDowntimeDto): Promise<DowntimeRecord>;
    delete(id: string): Promise<void>;
}
