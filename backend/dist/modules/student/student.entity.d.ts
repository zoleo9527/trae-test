import { WorkOrder } from '../work-order/work-order.entity';
export declare class Student {
    id: string;
    name: string;
    englishName: string;
    phone: string;
    email: string;
    targetCountry: string;
    targetSchool: string;
    targetMajor: string;
    remarks: string;
    workOrders: WorkOrder[];
    createdAt: Date;
    updatedAt: Date;
}
