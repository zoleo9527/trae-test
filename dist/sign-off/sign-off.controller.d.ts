import { SignOffService } from './sign-off.service';
import { CreateSignOffDto } from './dto/create-sign-off.dto';
import { ActionSignOffDto } from './dto/action-sign-off.dto';
import { SignOffStatus } from '../common/enums/sign-off.enum';
export declare class SignOffController {
    private readonly signOffService;
    constructor(signOffService: SignOffService);
    create(req: any, createSignOffDto: CreateSignOffDto): Promise<import("./entities/sign-off.entity").SignOff>;
    findAll(page?: number, limit?: number, status?: SignOffStatus, signOffType?: string): Promise<{
        data: import("./entities/sign-off.entity").SignOff[];
        total: number;
        page: number;
        limit: number;
    }>;
    getPending(req: any): Promise<import("./entities/sign-off.entity").SignOff[]>;
    getMySigned(req: any): Promise<import("./entities/sign-off.entity").SignOff[]>;
    getMyRequested(req: any): Promise<import("./entities/sign-off.entity").SignOff[]>;
    findOne(id: string): Promise<import("./entities/sign-off.entity").SignOff>;
    sign(req: any, id: string, actionDto: ActionSignOffDto): Promise<import("./entities/sign-off.entity").SignOff>;
    reject(req: any, id: string, actionDto: ActionSignOffDto): Promise<import("./entities/sign-off.entity").SignOff>;
    findByChangeOrder(changeOrderId: string): Promise<import("./entities/sign-off.entity").SignOff[]>;
}
