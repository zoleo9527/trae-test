import { InspectionType, MaterialStatus, EvidenceType } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';

export const inspectionService = {
  async create(data: {
    materialId: string;
    type: InspectionType;
    result: string;
    status: string;
    rejectionReason?: string;
    supplementNote?: string;
    evidences?: Array<{ type: EvidenceType; url: string; description?: string }>;
  }, inspectorId: string, ipAddress?: string) {
    const material = await prisma.material.findUnique({ where: { id: data.materialId } });
    if (!material) {
      throw new AppError('主材不存在', 'MATERIAL_NOT_FOUND', 404);
    }

    const inspection = await prisma.$transaction(async (tx) => {
      const insp = await tx.inspection.create({
        data: {
          materialId: data.materialId,
          type: data.type,
          result: data.result,
          status: data.status,
          rejectionReason: data.rejectionReason,
          supplementNote: data.supplementNote,
          inspectorId,
          inspectedAt: new Date()
        },
        include: {
          inspector: { select: { id: true, name: true, role: true } },
          material: { select: { id: true, name: true, status: true } }
        }
      });

      if (data.evidences && data.evidences.length > 0) {
        await tx.evidence.createMany({
          data: data.evidences.map(e => ({
            ...e,
            inspectionId: insp.id,
            uploadedBy: inspectorId
          }))
        });
      }

      let newMaterialStatus: MaterialStatus | null = null;
      let changeReason = '';

      if (data.type === InspectionType.MATERIAL_ARRIVAL) {
        if (data.result === 'PASS') {
          newMaterialStatus = MaterialStatus.INSPECTION_PASSED;
          changeReason = '到场验收通过';
        } else {
          newMaterialStatus = MaterialStatus.INSPECTION_FAILED;
          changeReason = '到场验收不通过';
        }
      }

      if (data.type === InspectionType.INSTALLATION_QUALITY) {
        if (data.result === 'PASS') {
          newMaterialStatus = MaterialStatus.INSTALLATION_COMPLETED;
          changeReason = '安装质量验收通过';
        }
      }

      if (data.type === InspectionType.FINAL_ACCEPTANCE) {
        if (data.result === 'PASS') {
          newMaterialStatus = MaterialStatus.ACCEPTED;
          changeReason = '最终验收通过';
        }
      }

      if (newMaterialStatus && material.status !== newMaterialStatus) {
        await tx.material.update({
          where: { id: data.materialId },
          data: { 
            status: newMaterialStatus, 
            version: { increment: 1 },
            actualArrivalDate: data.type === InspectionType.MATERIAL_ARRIVAL && material.actualArrivalDate === null
              ? new Date()
              : undefined
          }
        });

        await tx.changeLog.create({
          data: {
            materialId: data.materialId,
            fieldName: 'status',
            oldValue: material.status,
            newValue: newMaterialStatus,
            changedBy: inspectorId,
            changeReason
          }
        });
      }

      return insp;
    });

    await auditService.log(inspectorId, 'CREATE_INSPECTION', data.materialId, {
      type: data.type,
      result: data.result,
      rejectionReason: data.rejectionReason
    }, ipAddress);

    return inspection;
  },

  async getByMaterial(materialId: string) {
    const material = await prisma.material.findUnique({ where: { id: materialId } });
    if (!material) {
      throw new AppError('主材不存在', 'MATERIAL_NOT_FOUND', 404);
    }

    return prisma.inspection.findMany({
      where: { materialId },
      include: {
        inspector: { select: { id: true, name: true, role: true } },
        evidences: true,
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async reject(id: string, rejectionReason: string, userId: string, ipAddress?: string) {
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: { material: true }
    });

    if (!inspection) {
      throw new AppError('验收记录不存在', 'INSPECTION_NOT_FOUND', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const insp = await tx.inspection.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason
        }
      });

      const oldStatus = inspection.material.status;
      const newStatus = MaterialStatus.REJECTED;

      if (oldStatus !== newStatus) {
        await tx.material.update({
          where: { id: inspection.materialId },
          data: {
            status: newStatus,
            version: { increment: 1 }
          }
        });

        await tx.changeLog.create({
          data: {
            materialId: inspection.materialId,
            fieldName: 'status',
            oldValue: oldStatus,
            newValue: newStatus,
            changedBy: userId,
            changeReason: `验收驳回: ${rejectionReason}`
          }
        });
      }

      return insp;
    });

    await auditService.log(userId, 'REJECT_INSPECTION', inspection.materialId, {
      inspectionId: id,
      rejectionReason
    }, ipAddress);

    return result;
  },

  async supplement(id: string, data: {
    supplementNote: string;
    evidences?: Array<{ type: EvidenceType; url: string; description?: string }>;
  }, userId: string, ipAddress?: string) {
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: { material: true }
    });

    if (!inspection) {
      throw new AppError('验收记录不存在', 'INSPECTION_NOT_FOUND', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const insp = await tx.inspection.update({
        where: { id },
        data: {
          supplementNote: data.supplementNote,
          status: 'SUPPLEMENTED'
        }
      });

      if (data.evidences && data.evidences.length > 0) {
        await tx.evidence.createMany({
          data: data.evidences.map(e => ({
            ...e,
            inspectionId: id,
            uploadedBy: userId
          }))
        });
      }

      const oldStatus = inspection.material.status;
      let newStatus = oldStatus;
      let changeReason = '';

      if (inspection.type === InspectionType.MATERIAL_ARRIVAL) {
        newStatus = MaterialStatus.INSPECTION_PENDING;
        changeReason = '补录完成，待重新到场验收';
      } else if (inspection.type === InspectionType.INSTALLATION_QUALITY || inspection.type === InspectionType.FINAL_ACCEPTANCE) {
        newStatus = MaterialStatus.INSTALLING;
        changeReason = '补录完成，待重新安装验收';
      }

      if (oldStatus !== newStatus) {
        await tx.material.update({
          where: { id: inspection.materialId },
          data: {
            status: newStatus,
            version: { increment: 1 }
          }
        });

        await tx.changeLog.create({
          data: {
            materialId: inspection.materialId,
            fieldName: 'status',
            oldValue: oldStatus,
            newValue: newStatus,
            changedBy: userId,
            changeReason: `${changeReason} - ${data.supplementNote}`
          }
        });
      }

      return insp;
    });

    await auditService.log(userId, 'SUPPLEMENT_INSPECTION', inspection.materialId, {
      inspectionId: id,
      supplementNote: data.supplementNote
    }, ipAddress);

    return result;
  },

  async addComment(inspectionId: string, content: string, authorId: string) {
    const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId } });
    if (!inspection) {
      throw new AppError('验收记录不存在', 'INSPECTION_NOT_FOUND', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        inspectionId,
        content,
        authorId
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    });

    await auditService.log(authorId, 'ADD_COMMENT', inspection.materialId, {
      inspectionId,
      content
    });

    return comment;
  }
};
