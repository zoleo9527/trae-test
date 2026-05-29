import { NegotiationStatus } from '../negotiation.entity';
export declare class CreateNegotiationDto {
    diseaseId: number;
    initiatorId: number;
    salesOpinion?: string;
    baseOpinion?: string;
    replantQuantity?: number;
    replantVariety?: string;
    replantDate?: string;
    status?: NegotiationStatus;
}
export declare class UpdateNegotiationStatusDto {
    status: NegotiationStatus;
    operatorId: number;
    salesOpinion?: string;
    baseOpinion?: string;
    replantQuantity?: number;
    replantVariety?: string;
    replantDate?: string;
}
export declare class QueryNegotiationDto {
    diseaseId?: number;
    status?: NegotiationStatus;
    initiatorId?: number;
    startDate?: string;
    endDate?: string;
}
