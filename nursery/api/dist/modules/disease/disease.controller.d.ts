import { Disease } from './disease.entity';
import { DiseaseService } from './disease.service';
import { CreateDiseaseDto, QueryDiseaseDto, UpdateDiseaseStatusDto } from './dto/disease.dto';
export declare class DiseaseController {
    private readonly diseaseService;
    constructor(diseaseService: DiseaseService);
    findAll(query: QueryDiseaseDto): Promise<Disease[]>;
    findOne(id: number): Promise<Disease>;
    create(dto: CreateDiseaseDto): Promise<Disease>;
    updateStatus(id: number, dto: UpdateDiseaseStatusDto): Promise<Disease>;
}
