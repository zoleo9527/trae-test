import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { User } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
export declare class DeliveryService {
    private deliveryRepository;
    private auditService;
    constructor(deliveryRepository: Repository<Delivery>, auditService: AuditService);
    private generateDeliveryNumber;
    create(createDto: CreateDeliveryDto, user: User): Promise<Delivery>;
    findAll(page?: number, limit?: number, filters?: {
        projectId?: string;
        status?: DeliveryStatus;
    }): Promise<{
        data: Delivery[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Delivery>;
    update(id: string, updateDto: UpdateDeliveryDto, user: User): Promise<Delivery>;
    receive(id: string, user: User): Promise<Delivery>;
    findByChangeOrder(changeOrderId: string): Promise<Delivery[]>;
}
