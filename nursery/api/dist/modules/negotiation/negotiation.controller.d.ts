import { CreateNegotiationDto, QueryNegotiationDto, UpdateNegotiationStatusDto } from './dto/negotiation.dto';
import { Negotiation } from './negotiation.entity';
import { NegotiationService } from './negotiation.service';
export declare class NegotiationController {
    private readonly negotiationService;
    constructor(negotiationService: NegotiationService);
    findAll(query: QueryNegotiationDto): Promise<Negotiation[]>;
    findOne(id: number): Promise<Negotiation>;
    create(dto: CreateNegotiationDto): Promise<Negotiation>;
    updateStatus(id: number, dto: UpdateNegotiationStatusDto): Promise<Negotiation>;
}
