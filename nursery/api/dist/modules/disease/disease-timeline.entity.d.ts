import { User } from '../user/user.entity';
import { Disease } from './disease.entity';
export declare class DiseaseTimeline {
    id: number;
    disease: Disease;
    diseaseId: number;
    operator: User;
    operatorId: number;
    action: string;
    content: string;
    operatedAt: Date;
}
