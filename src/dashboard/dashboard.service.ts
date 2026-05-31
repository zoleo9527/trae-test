import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeOrder } from '../change-order/entities/change-order.entity';
import { SignOff } from '../sign-off/entities/sign-off.entity';
import { ChangeOrderStatus } from '../common/enums/change-order-status.enum';
import { SignOffStatus } from '../common/enums/sign-off.enum';
import { User } from '../user/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ChangeOrder)
    private changeOrderRepository: Repository<ChangeOrder>,
    @InjectRepository(SignOff)
    private signOffRepository: Repository<SignOff>,
  ) {}

  async getOverview(user: User) {
    const [pendingChangeOrders, rejectedChangeOrders, pendingSignOffs, totalChangeOrders] = await Promise.all([
      this.changeOrderRepository.count({
        where: {
          status: ChangeOrderStatus.SUBMITTED,
        },
      }),
      this.changeOrderRepository.count({
        where: {
          status: ChangeOrderStatus.REJECTED,
        },
      }),
      this.signOffRepository.count({
        where: {
          status: SignOffStatus.PENDING,
        },
      }),
      this.changeOrderRepository.count(),
    ]);

    const needsReview = await this.changeOrderRepository
      .createQueryBuilder('co')
      .leftJoin('co.signOffs', 'so')
      .where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      })
      .andWhere('(so.id IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' })
      .getCount();

    return {
      pendingChangeOrders,
      rejectedChangeOrders,
      pendingSignOffs,
      needsReview,
      totalChangeOrders,
    };
  }

  async getPendingItems(user: User) {
    const pendingChangeOrders = await this.changeOrderRepository.find({
      where: {
        status: ChangeOrderStatus.SUBMITTED,
      },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const pendingSignOffs = await this.signOffRepository.find({
      where: { status: SignOffStatus.PENDING },
      relations: ['requestedBy', 'changeOrder', 'dailyReport', 'delivery'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      changeOrders: pendingChangeOrders,
      signOffs: pendingSignOffs,
    };
  }

  async getRejectedItems(user: User) {
    return this.changeOrderRepository.find({
      where: {
        status: ChangeOrderStatus.REJECTED,
      },
      relations: ['createdBy', 'approvedBy'],
      order: { updatedAt: 'DESC' },
      take: 10,
    });
  }

  async getNeedsReview(user: User) {
    return this.changeOrderRepository
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
  }

  async getStatusStatistics() {
    const result = await this.changeOrderRepository
      .createQueryBuilder('co')
      .select('co.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('co.status')
      .getRawMany();

    const statistics: any = {};
    for (const status of Object.values(ChangeOrderStatus)) {
      statistics[status] = 0;
    }

    for (const row of result) {
      statistics[row.status] = parseInt(row.count, 10);
    }

    return statistics;
  }

  async getRecentActivity(user: User) {
    const recentChangeOrders = await this.changeOrderRepository.find({
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    const recentSignOffs = await this.signOffRepository.find({
      where: { status: SignOffStatus.SIGNED },
      relations: ['signedBy', 'changeOrder'],
      order: { signedAt: 'DESC' },
      take: 5,
    });

    return {
      recentChangeOrders,
      recentSignOffs,
    };
  }

  async getMyTasks(user: User) {
    const myPendingSignOffs = await this.signOffRepository.count({
      where: { status: SignOffStatus.PENDING },
    });

    const myRequestedSignOffs = await this.signOffRepository.find({
      where: {
        requestedById: user.id,
        status: SignOffStatus.PENDING,
      },
      relations: ['changeOrder'],
      take: 5,
    });

    const myChangeOrders = await this.changeOrderRepository.find({
      where: {
        createdById: user.id,
        status: ChangeOrderStatus.DRAFT,
      },
      take: 5,
    });

    return {
      pendingSignOffCount: myPendingSignOffs,
      requestedSignOffs: myRequestedSignOffs,
      draftChangeOrders: myChangeOrders,
    };
  }
}
