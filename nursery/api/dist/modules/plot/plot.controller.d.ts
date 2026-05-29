import { CreatePlotDto, QueryPlotDto } from './dto/plot.dto';
import { Plot } from './plot.entity';
import { PlotService } from './plot.service';
export declare class PlotController {
    private readonly plotService;
    constructor(plotService: PlotService);
    findAll(query: QueryPlotDto): Promise<Plot[]>;
    findOne(id: number): Promise<Plot>;
    create(dto: CreatePlotDto): Promise<Plot>;
    update(id: number, dto: Partial<CreatePlotDto>): Promise<Plot>;
}
