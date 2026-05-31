import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeOrder } from './change-order/entities/change-order.entity';
import { SignOff } from './sign-off/entities/sign-off.entity';
import { ChangeOrderStatus } from './common/enums/change-order-status.enum';
import { SignOffStatus } from './common/enums/sign-off.enum';
import { Role } from './common/enums/role.enum';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@ApiTags('首页')
@Controller()
export class AppController {
  constructor(
    @InjectRepository(ChangeOrder)
    private changeOrderRepository: Repository<ChangeOrder>,
    @InjectRepository(SignOff)
    private signOffRepository: Repository<SignOff>,
  ) {}

  @Get()
  @ApiOperation({ summary: '系统状态' })
  getStatus() {
    return {
      name: '地坪施工-变更报价与签认留痕系统',
      version: '1.0.0',
      status: 'running',
      docs: '/api',
    };
  }

  @Get('home')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '首页聚合数据 - 待处理、已驳回、需回查' })
  async getHomeData(@Request() req) {
    const user = req.user;

    const [pendingChangeOrders, rejectedChangeOrders, pendingSignOffs, totalChangeOrders] = await Promise.all([
      this.getPendingChangeOrdersForUser(user),
      this.changeOrderRepository.find({
        where: {
          status: ChangeOrderStatus.REJECTED,
        },
        relations: ['createdBy', 'approvedBy'],
        order: { updatedAt: 'DESC' },
        take: 10,
      }),
      this.getPendingSignOffsForUser(user),
      this.changeOrderRepository.count(),
    ]);

    const needsReview = await this.changeOrderRepository
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy')
      .leftJoin('co.signOffs', 'so')
      .where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      })
      .andWhere('(so.id IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' })
      .orderBy('co.createdAt', 'DESC')
      .take(10)
      .getMany();

    const statusStatistics = await this.changeOrderRepository
      .createQueryBuilder('co')
      .select('co.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('co.status')
      .getRawMany();

    const statistics: any = {};
    for (const status of Object.values(ChangeOrderStatus)) {
      statistics[status] = 0;
    }
    for (const row of statusStatistics) {
      statistics[row.status] = parseInt(row.count, 10);
    }

    return {
      summary: {
        pendingChangeOrders: pendingChangeOrders.length,
        rejectedChangeOrders: rejectedChangeOrders.length,
        pendingSignOffs: pendingSignOffs.length,
        needsReview: needsReview.length,
        totalChangeOrders,
      },
      pending: {
        changeOrders: pendingChangeOrders,
        signOffs: pendingSignOffs,
      },
      rejected: {
        changeOrders: rejectedChangeOrders,
      },
      needsReview: {
        changeOrders: needsReview,
      },
      statistics,
    };
  }

  private async getPendingChangeOrdersForUser(user: any): Promise<ChangeOrder[]> {
    const queryBuilder = this.changeOrderRepository.createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy')
      .leftJoin('co.signOffs', 'so');

    if (user.role === Role.ADMIN) {
      queryBuilder.where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      });
    } else if (user.role === Role.PROJECT_MANAGER) {
      queryBuilder.where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      });
    } else if (user.role === Role.SUPERVISOR) {
      queryBuilder.where('co.status = :status', {
        status: ChangeOrderStatus.SUBMITTED,
      });
    } else if (user.role === Role.CLIENT) {
      queryBuilder.where('co.status = :status', {
        status: ChangeOrderStatus.APPROVED,
      });
    } else {
      queryBuilder.where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
        ],
      });
    }

    return queryBuilder
      .orderBy('co.createdAt', 'DESC')
      .take(10)
      .getMany();
  }

  private async getPendingSignOffsForUser(user: any): Promise<SignOff[]> {
    const queryBuilder = this.signOffRepository.createQueryBuilder('so')
      .leftJoinAndSelect('so.requestedBy', 'requestedBy')
      .leftJoinAndSelect('so.changeOrder', 'changeOrder')
      .leftJoinAndSelect('so.dailyReport', 'dailyReport')
      .leftJoinAndSelect('so.delivery', 'delivery')
      .where('so.status = :status', { status: SignOffStatus.PENDING });

    if (user.role !== Role.ADMIN) {
      queryBuilder.andWhere(
        '(so.signerRole IS NULL OR so.signerRole = :userRole)',
        { userRole: user.role },
      );
      queryBuilder.andWhere(
        '(so.signerDepartment IS NULL OR so.signerDepartment = :userDepartment)',
        { userDepartment: user.department },
      );
    }

    return queryBuilder
      .orderBy('so.createdAt', 'DESC')
      .take(10)
      .getMany();
  }
}
