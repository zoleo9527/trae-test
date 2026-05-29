import { CreateInspectionDto, QueryInspectionDto } from './dto/inspection.dto';
import { Inspection } from './inspection.entity';
import { InspectionService } from './inspection.service';
export declare class InspectionController {
    private readonly inspectionService;
    constructor(inspectionService: InspectionService);
    findAll(query: QueryInspectionDto): Promise<Inspection[]>;
    findOne(id: number): Promise<Inspection>;
    create(dto: CreateInspectionDto): Promise<Inspection>;
    complete(id: number, dto: Partial<CreateInspectionDto>): Promise<Inspection>;
}
