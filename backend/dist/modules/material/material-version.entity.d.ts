import { Material } from './material.entity';
import { Consultant } from '../consultant/consultant.entity';
export declare class MaterialVersion {
    id: string;
    materialId: string;
    material: Material;
    version: number;
    fileUrl: string;
    changeLog: string;
    uploadedBy: string;
    uploader: Consultant;
    createdAt: Date;
}
