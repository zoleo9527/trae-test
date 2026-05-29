import { Repository } from 'typeorm';
import { CreateInspectionDto, QueryInspectionDto } from './dto/inspection.dto';
import { Inspection } from './inspection.entity';
export declare class InspectionService {
    private readonly inspectionRepository;
    constructor(inspectionRepository: Repository<Inspection>);
    findAll(query?: QueryInspectionDto): Promise<Inspection[]>;
    findOne(id: number): Promise<Inspection>;
    create(dto: CreateInspectionDto): Promise<Inspection>;
    complete(id: number, dto: Partial<CreateInspectionDto>): Promise<Inspection>;
}
