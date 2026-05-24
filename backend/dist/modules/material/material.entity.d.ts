import { MaterialStatus, MaterialType } from '../../common/enums/material-status.enum';
import { WorkOrder } from '../work-order/work-order.entity';
import { Consultant } from '../consultant/consultant.entity';
import { MaterialVersion } from './material-version.entity';
import { Comment } from '../comment/comment.entity';
export declare class Material {
    id: string;
    workOrderId: string;
    workOrder: WorkOrder;
    name: string;
    type: MaterialType;
    status: MaterialStatus;
    currentVersion: number;
    fileUrl: string;
    description: string;
    deadline: Date;
    ownerId: string;
    owner: Consultant;
    versions: MaterialVersion[];
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
