import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialStatusDto } from './dto/update-material-status.dto';
import { UploadVersionDto } from './dto/upload-version.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
export declare class MaterialController {
    private readonly materialService;
    constructor(materialService: MaterialService);
    create(createDto: CreateMaterialDto): Promise<import("./material.entity").Material>;
    findAll(query: QueryMaterialDto): Promise<{
        data: import("./material.entity").Material[];
        total: number;
    }>;
    checkDeadlines(): Promise<import("./material.entity").Material[]>;
    findOne(id: string): Promise<import("./material.entity").Material>;
    getVersions(id: string): Promise<import("./material-version.entity").MaterialVersion[]>;
    updateStatus(id: string, updateDto: UpdateMaterialStatusDto): Promise<import("./material.entity").Material>;
    uploadVersion(id: string, dto: UploadVersionDto): Promise<import("./material.entity").Material>;
}
