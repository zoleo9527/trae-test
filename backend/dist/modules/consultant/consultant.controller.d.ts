import { ConsultantService } from './consultant.service';
import { Role } from '../../common/enums/role.enum';
export declare class ConsultantController {
    private readonly consultantService;
    constructor(consultantService: ConsultantService);
    create(data: any): Promise<import("./consultant.entity").Consultant>;
    findAll(role?: Role): Promise<import("./consultant.entity").Consultant[]>;
    findOne(id: string): Promise<import("./consultant.entity").Consultant>;
}
