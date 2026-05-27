import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RefundStatus, UserRole, TaskType, TaskStatus, PackageStatus } from '@prisma/client';
import { SubmitRefundDto, CsReviewDto, InspectionSubmitDto, FinalReviewDto } from './dto/refund-flow.dto';
import { BatchReviewDto, BatchReviewResult } from './dto/batch-review.dto';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async submitRefund(dto: SubmitRefundDto) {
    const pkg = await this.prisma.customerPackage.findUnique({
      where: { id: dto.packageId },
    });

    if (!pkg) {
      throw new BadRequestException('套餐不存在');
    }

    const remainingCount = pkg.totalCount - pkg.usedCount;
    if (dto.refundCount > remainingCount) {
      throw new BadRequestException('退款次数超过剩余次数');
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refundRequest.create({
        data: {
          packageId: dto.packageId,
          verificationId: dto.verificationId,
          customerReason: dto.customerReason,
          refundCount: dto.refundCount,
          status: RefundStatus.SUBMITTED,
        },
        include: {
          package: true,
          verification: true,
          flowLogs: true,
        },
      });

      await tx.refundFlowLog.create({
        data: {
          refundId: refund.id,
          fromStatus: null,
          toStatus: RefundStatus.SUBMITTED,
          operatorId: 'system',
          operatorName: '系统自动',
          operatorRole: UserRole.OPERATION_MANAGER,
          remark: '用户提交退款申诉',
        },
      });

      return refund;
    });
  }

  async csReview(dto: CsReviewDto) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: dto.refundId },
      include: { csReviewer: true },
    });

    if (!refund) {
      throw new BadRequestException('退款申请不存在');
    }

    if (refund.status !== RefundStatus.SUBMITTED) {
      throw new BadRequestException('当前状态不允许客服审核');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: dto.csReviewerId },
    });

    const nextStatus = dto.needInspection
      ? RefundStatus.INSPECTION_REQUIRED
      : RefundStatus.CS_REVIEWING;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.refundRequest.update({
        where: { id: dto.refundId },
        data: {
          status: nextStatus,
          csReviewerId: dto.csReviewerId,
          csOpinion: dto.csOpinion,
          csReviewTime: new Date(),
        },
        include: {
          package: true,
          flowLogs: true,
        },
      });

      await tx.refundFlowLog.create({
        data: {
          refundId: dto.refundId,
          fromStatus: RefundStatus.SUBMITTED,
          toStatus: nextStatus,
          operatorId: dto.csReviewerId,
          operatorName: reviewer?.name || '未知客服',
          operatorRole: UserRole.CUSTOMER_SERVICE,
          remark: dto.csOpinion,
        },
      });

      if (dto.needInspection) {
        const refundWithStation = await tx.refundRequest.findUnique({
          where: { id: dto.refundId },
          include: { verification: { include: { station: true } } },
        });

        if (refundWithStation?.verification?.stationId) {
          await tx.task.create({
            data: {
              type: TaskType.REFUND_REVIEW,
              stationId: refundWithStation.verification.stationId,
              relatedId: dto.refundId,
              relatedType: 'RefundRequest',
              title: `退款申诉现场核验 - ${refundWithStation.verification.station.name}`,
              description: `退款原因: ${refund.customerReason}\n客服意见: ${dto.csOpinion}`,
              status: TaskStatus.UNASSIGNED,
              priority: 2,
            },
          });
        }
      }

      return updated;
    });
  }

  async submitInspection(dto: InspectionSubmitDto) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: dto.refundId },
    });

    if (!refund) {
      throw new BadRequestException('退款申请不存在');
    }

    if (refund.status !== RefundStatus.INSPECTION_REQUIRED) {
      throw new BadRequestException('当前状态不允许提交巡检结果');
    }

    const inspector = await this.prisma.user.findUnique({
      where: { id: dto.inspectorId },
    });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.refundRequest.update({
        where: { id: dto.refundId },
        data: {
          status: RefundStatus.CS_REVIEWING,
          inspectorId: dto.inspectorId,
          inspectionResult: dto.inspectionResult,
          inspectionPhoto: dto.inspectionPhoto,
          inspectionTime: new Date(),
        },
        include: {
          package: true,
          flowLogs: true,
        },
      });

      await tx.refundFlowLog.create({
        data: {
          refundId: dto.refundId,
          fromStatus: RefundStatus.INSPECTION_REQUIRED,
          toStatus: RefundStatus.CS_REVIEWING,
          operatorId: dto.inspectorId,
          operatorName: inspector?.name || '未知巡检员',
          operatorRole: UserRole.INSPECTOR,
          remark: dto.inspectionResult,
        },
      });

      return updated;
    });
  }

  async finalReview(dto: FinalReviewDto) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: dto.refundId },
      include: { package: true },
    });

    if (!refund) {
      throw new BadRequestException('退款申请不存在');
    }

    if (refund.status !== RefundStatus.CS_REVIEWING) {
      throw new BadRequestException('当前状态不允许最终审核');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: dto.reviewerId },
    });

    const finalStatus =
      dto.finalDecision === 'APPROVED'
        ? RefundStatus.APPROVED
        : RefundStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.refundRequest.update({
        where: { id: dto.refundId },
        data: {
          status: finalStatus,
          finalDecision: finalStatus,
          finalReviewerId: dto.reviewerId,
          finalReviewTime: new Date(),
        },
        include: {
          package: true,
          flowLogs: true,
        },
      });

      await tx.refundFlowLog.create({
        data: {
          refundId: dto.refundId,
          fromStatus: RefundStatus.CS_REVIEWING,
          toStatus: finalStatus,
          operatorId: dto.reviewerId,
          operatorName: reviewer?.name || '未知审核人',
          operatorRole: UserRole.OPERATION_MANAGER,
          remark: dto.finalDecision === 'APPROVED' ? '运营主管批准退款' : '运营主管驳回退款',
        },
      });

      if (dto.finalDecision === 'APPROVED') {
        const currentPackage = await tx.customerPackage.findUnique({
          where: { id: refund.packageId },
        });
        
        if (currentPackage) {
          const newTotalCount = currentPackage.totalCount - refund.refundCount;
          let newStatus: PackageStatus = currentPackage.status;
          
          if (newTotalCount <= 0) {
            newStatus = PackageStatus.REFUNDED;
          } else if (newTotalCount <= currentPackage.usedCount) {
            newStatus = PackageStatus.USED_UP;
          }

          await tx.customerPackage.update({
            where: { id: refund.packageId },
            data: {
              totalCount: newTotalCount,
              status: newStatus,
            },
          });
        }
      }

      return updated;
    });
  }

  async batchReview(dto: BatchReviewDto): Promise<BatchReviewResult> {
    const result: BatchReviewResult = {
      successCount: 0,
      failCount: 0,
      results: [],
    };

    const reviewer = await this.prisma.user.findUnique({
      where: { id: dto.reviewerId },
    });

    for (const item of dto.items) {
      try {
        const refund = await this.prisma.refundRequest.findUnique({
          where: { id: item.refundId },
          include: { verification: { include: { station: true } } },
        });

        if (!refund) {
          result.results.push({
            refundId: item.refundId,
            success: false,
            message: '退款申请不存在',
          });
          result.failCount++;
          continue;
        }

        if (refund.status !== RefundStatus.CS_REVIEWING && refund.status !== RefundStatus.SUBMITTED) {
          result.results.push({
            refundId: item.refundId,
            success: false,
            message: '当前状态不允许批量审核',
          });
          result.failCount++;
          continue;
        }

        let newStatus: RefundStatus;
        let remark: string;

        switch (item.action) {
          case 'APPROVE':
            newStatus = RefundStatus.APPROVED;
            remark = item.remark || '批量审核通过';
            break;
          case 'REJECT':
            newStatus = RefundStatus.REJECTED;
            remark = item.remark || '批量审核驳回';
            break;
          case 'NEED_INSPECTION':
            newStatus = RefundStatus.INSPECTION_REQUIRED;
            remark = item.remark || '需现场核验';
            break;
          default:
            throw new BadRequestException('无效的操作类型');
        }

        await this.prisma.$transaction(async (tx) => {
          if (item.action === 'NEED_INSPECTION') {
            await tx.refundRequest.update({
              where: { id: item.refundId },
              data: {
                status: newStatus,
                csReviewerId: dto.reviewerId,
                csOpinion: remark,
                csReviewTime: new Date(),
              },
            });

            if (refund.verification?.stationId) {
              await tx.task.create({
                data: {
                  type: TaskType.REFUND_REVIEW,
                  stationId: refund.verification.stationId,
                  relatedId: item.refundId,
                  relatedType: 'RefundRequest',
                  title: `退款申诉现场核验 - ${refund.verification.station.name}`,
                  description: `退款原因: ${refund.customerReason}\n客服意见: ${remark}`,
                  status: TaskStatus.UNASSIGNED,
                  priority: 2,
                },
              });
            }
          } else {
            await tx.refundRequest.update({
              where: { id: item.refundId },
              data: {
                status: newStatus,
                finalDecision: item.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                finalReviewerId: dto.reviewerId,
                finalReviewTime: new Date(),
              },
            });
          }

          await tx.refundFlowLog.create({
            data: {
              refundId: item.refundId,
              fromStatus: refund.status,
              toStatus: newStatus,
              operatorId: dto.reviewerId,
              operatorName: reviewer?.name || '未知审核人',
              operatorRole: UserRole.OPERATION_MANAGER,
              remark,
            },
          });

          if (item.action === 'APPROVE') {
            const currentPackage = await tx.customerPackage.findUnique({
              where: { id: refund.packageId },
            });
            
            if (currentPackage) {
              const newTotalCount = currentPackage.totalCount - refund.refundCount;
              let newStatus: PackageStatus = currentPackage.status;
              
              if (newTotalCount <= 0) {
                newStatus = PackageStatus.REFUNDED;
              } else if (newTotalCount <= currentPackage.usedCount) {
                newStatus = PackageStatus.USED_UP;
              }

              await tx.customerPackage.update({
                where: { id: refund.packageId },
                data: {
                  totalCount: newTotalCount,
                  status: newStatus,
                },
              });
            }
          }
        });

        result.results.push({
          refundId: item.refundId,
          success: true,
        });
        result.successCount++;
      } catch (error) {
        result.results.push({
          refundId: item.refundId,
          success: false,
          message: error.message,
        });
        result.failCount++;
      }
    }

    return result;
  }

  async getRefundTimeline(refundId: string) {
    return this.prisma.refundFlowLog.findMany({
      where: { refundId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRefundList(status?: RefundStatus, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.refundRequest.findMany({
        where,
        include: {
          package: true,
          verification: { include: { station: true } },
          csReviewer: true,
          inspector: true,
        },
        orderBy: { submitTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refundRequest.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
