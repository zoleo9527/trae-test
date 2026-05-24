import { Repository } from 'typeorm';
import { Material } from './material.entity';
import { MaterialVersion } from './material-version.entity';
import { MaterialStatus } from '../../common/enums/material-status.enum';
import { AuditService } from '../audit/audit.service';
export declare class MaterialService {
    private readonly materialRepository;
    private readonly materialVersionRepository;
    private readonly auditService;
    constructor(materialRepository: Repository<Material>, materialVersionRepository: Repository<MaterialVersion>, auditService: AuditService);
    create(data: Partial<Material>, operatorId: string, operatorName: string): Promise<Material>;
    findAll(page?: number, limit?: number, filters?: {
        status?: MaterialStatus;
        workOrderId?: string;
        ownerId?: string;
        type?: string;
    }): Promise<{
        data: Material[];
        total: number;
    }>;
    findOne(id: string): Promise<Material>;
    updateStatus(id: string, newStatus: MaterialStatus, operatorId: string, operatorName: string): Promise<Material>;
    uploadNewVersion(id: string, fileUrl: string, changeLog: string, operatorId: string, operatorName: string): Promise<Material>;
    private createVersion;
    getVersions(materialId: string): Promise<MaterialVersion[]>;
    checkDeadlines(): Promise<Material[]>;
}
