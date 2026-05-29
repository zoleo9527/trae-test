import { Disease } from '../disease/disease.entity';
import { User } from '../user/user.entity';
export declare enum NegotiationStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    CONFIRMED = "confirmed",
    CLOSED = "closed"
}
export declare class Negotiation {
    id: number;
    disease: Disease;
    diseaseId: number;
    initiator: User;
    initiatorId: number;
    confirmedBy: User;
    confirmedById: number;
    salesOpinion: string;
    baseOpinion: string;
    replantQuantity: number;
    replantVariety: string;
    replantDate: string;
    status: NegotiationStatus;
    createdAt: Date;
    confirmedAt: Date;
    updatedAt: Date;
}
