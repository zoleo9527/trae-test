import { Repository } from 'typeorm';
import { Inspection } from '../inspection/inspection.entity';
import { DiseaseTimeline } from './disease-timeline.entity';
import { Disease } from './disease.entity';
import { CreateDiseaseDto, CreateTimelineDto, QueryDiseaseDto, UpdateDiseaseStatusDto } from './dto/disease.dto';
export declare class DiseaseService {
    private readonly diseaseRepository;
    private readonly timelineRepository;
    private readonly inspectionRepository;
    constructor(diseaseRepository: Repository<Disease>, timelineRepository: Repository<DiseaseTimeline>, inspectionRepository: Repository<Inspection>);
    findAll(query?: QueryDiseaseDto): Promise<Disease[]>;
    findOne(id: number): Promise<Disease>;
    create(dto: CreateDiseaseDto): Promise<Disease>;
    updateStatus(id: number, dto: UpdateDiseaseStatusDto): Promise<Disease>;
    addTimeline(dto: CreateTimelineDto): Promise<DiseaseTimeline>;
    checkOverdue(id: number): Promise<void>;
    updateOverdueStatus(): Promise<void>;
    private getSeverityText;
    private getStatusActionText;
}
