import { Repository } from 'typeorm';
import { DiseaseService } from '../disease/disease.service';
import { CreateNegotiationDto, QueryNegotiationDto, UpdateNegotiationStatusDto } from './dto/negotiation.dto';
import { Negotiation } from './negotiation.entity';
export declare class NegotiationService {
    private readonly negotiationRepository;
    private readonly diseaseService;
    constructor(negotiationRepository: Repository<Negotiation>, diseaseService: DiseaseService);
    findAll(query?: QueryNegotiationDto): Promise<Negotiation[]>;
    findOne(id: number): Promise<Negotiation>;
    create(dto: CreateNegotiationDto): Promise<Negotiation>;
    updateStatus(id: number, dto: UpdateNegotiationStatusDto): Promise<Negotiation>;
    private getStatusActionText;
}
