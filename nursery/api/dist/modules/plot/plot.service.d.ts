import { Repository } from 'typeorm';
import { CreatePlotDto, QueryPlotDto } from './dto/plot.dto';
import { Plot } from './plot.entity';
export declare class PlotService {
    private readonly plotRepository;
    constructor(plotRepository: Repository<Plot>);
    findAll(query?: QueryPlotDto): Promise<Plot[]>;
    findOne(id: number): Promise<Plot>;
    create(dto: CreatePlotDto): Promise<Plot>;
    update(id: number, dto: Partial<CreatePlotDto>): Promise<Plot>;
}
