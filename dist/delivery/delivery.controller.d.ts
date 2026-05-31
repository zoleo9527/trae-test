import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveryStatus } from './entities/delivery.entity';
export declare class DeliveryController {
    private readonly deliveryService;
    constructor(deliveryService: DeliveryService);
    create(req: any, createDeliveryDto: CreateDeliveryDto): Promise<import("./entities/delivery.entity").Delivery>;
    findAll(page?: number, limit?: number, projectId?: string, status?: DeliveryStatus): Promise<{
        data: import("./entities/delivery.entity").Delivery[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./entities/delivery.entity").Delivery>;
    update(req: any, id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<import("./entities/delivery.entity").Delivery>;
    receive(req: any, id: string): Promise<import("./entities/delivery.entity").Delivery>;
    findByChangeOrder(changeOrderId: string): Promise<import("./entities/delivery.entity").Delivery[]>;
}
