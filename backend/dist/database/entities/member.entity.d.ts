import { BaseEntity } from './base.entity';
import { WorkOrder } from './work-order.entity';
import { FollowUp } from './follow-up.entity';
export declare enum MemberLevel {
    NORMAL = "normal",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum",
    DIAMOND = "diamond"
}
export declare class Member extends BaseEntity {
    memberNo: string;
    realName: string;
    phone: string;
    gender: string;
    birthday: Date;
    level: MemberLevel;
    totalConsumption: number;
    points: number;
    remark: string;
    workOrders: WorkOrder[];
    followUps: FollowUp[];
}
