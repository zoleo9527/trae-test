import { User } from '../user/user.entity';
export declare class Plot {
    id: number;
    name: string;
    location: string;
    variety: string;
    specification: string;
    quantity: number;
    inspector: User;
    inspectorId: number;
    createdAt: Date;
    updatedAt: Date;
}
