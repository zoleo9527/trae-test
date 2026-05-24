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

      if (data.type === InspectionType.MATERIAL_ARRIVAL) {
        const newStatus = data.result === 'PASS'
          ? MaterialStatus.INSPECTION_PASSED
          : MaterialStatus.INSPECTION_FAILED;
        await tx.material.update({
          where: { id: data.materialId },
          data: { status: newStatus, version: { increment: 1 } }
        });

        await tx.changeLog.create({
          data: {
            materialId: data.materialId,
            fieldName: 'status',
            oldValue: material.status,
            newValue: newStatus,
            changedBy: inspectorId,
            changeReason: `到场验收${data.result === 'PASS' ? '通过' : '不通过'}`
          }
        });
      }

      if (data.type === InspectionType.FINAL_ACCEPTANCE && data.result === 'PASS') {
        await tx.material.update({
          where: { id: data.materialId },
          data: { status: MaterialStatus.ACCEPTED, version: { increment: 1 } }
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

    const updated = await prisma.$transaction(async (tx) => {
      const insp = await tx.inspection.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason
        }
      });

      await tx.material.update({
        where: { id: inspection.materialId },
        data: {
          status: MaterialStatus.REJECTED,
          version: { increment: 1 }
        }
      });

      return insp;
    });

    await auditService.log(userId, 'REJECT_INSPECTION', inspection.materialId, {
      inspectionId: id,
      rejectionReason
    }, ipAddress);

    return updated;
  },

  async supplement(id: string, data: {
    supplementNote: string;
    evidences?: Array<{ type: EvidenceType; url: string; description?: string }>;
  }, userId: string, ipAddress?: string) {
    const inspection = await prisma.inspection.findUnique({ where: { id } });
    if (!inspection) {
      throw new AppError('验收记录不存在', 'INSPECTION_NOT_FOUND', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
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

      return insp;
    });

    await auditService.log(userId, 'SUPPLEMENT_INSPECTION', inspection.materialId, {
      inspectionId: id,
      supplementNote: data.supplementNote
    }, ipAddress);

    return updated;
  },

  async addComment(inspectionId: string, content: string, authorId: string) {
    return prisma.comment.create({
      data: {
        inspectionId,
        content,
        authorId
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    });
  }
};
