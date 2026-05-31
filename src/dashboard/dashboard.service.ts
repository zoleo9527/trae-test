import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeOrder } from '../change-order/entities/change-order.entity';
import { SignOff } from '../sign-off/entities/sign-off.entity';
import { ChangeOrderStatus } from '../common/enums/change-order-status.enum';
import { SignOffStatus } from '../common/enums/sign-off.enum';
import { Role } from '../common/enums/role.enum';
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
    const [rejectedChangeOrders, totalChangeOrders] = await Promise.all([
      this.changeOrderRepository.count({
        where: {
          status: ChangeOrderStatus.REJECTED,
        },
      }),
      this.changeOrderRepository.count(),
    ]);

    const pendingChangeOrders = await this.countPendingChangeOrdersForUser(user);
    const pendingSignOffs = await this.countPendingSignOffsForUser(user);
    const needsReview = await this.countNeedsReviewForUser(user);

    return {
      pendingChangeOrders,
      rejectedChangeOrders,
      pendingSignOffs,
      needsReview,
      totalChangeOrders,
    };
  }

  private async countPendingChangeOrdersForUser(user: User): Promise<number> {
    const queryBuilder = this.changeOrderRepository.createQueryBuilder('co');

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

    return queryBuilder.getCount();
  }

  private async countPendingSignOffsForUser(user: User): Promise<number> {
    const queryBuilder = this.signOffRepository
      .createQueryBuilder('so')
      .leftJoin('so.changeOrder', 'co')
      .where('so.status = :status', { status: SignOffStatus.PENDING })
      .andWhere(
        '(so.changeOrderId IS NULL OR so.processVersion = co.signOffProcessVersion)',
      );

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

    return queryBuilder.getCount();
  }

  private async countNeedsReviewForUser(user: User): Promise<number> {
    const queryBuilder = this.changeOrderRepository
      .createQueryBuilder('co')
      .leftJoin('co.signOffs', 'so', 'so.processVersion = co.signOffProcessVersion')
      .where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      })
      .andWhere('(so.id IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' });

    if (user.role !== Role.ADMIN) {
      queryBuilder.andWhere(
        '(so.signerRole IS NULL OR so.signerRole = :userRole)',
        { userRole: user.role },
      );
    }

    return queryBuilder.getCount();
  }

  async getPendingItems(user: User) {
    const pendingChangeOrders = await this.getPendingChangeOrdersForUser(user);
    const pendingSignOffs = await this.getPendingSignOffsForUser(user);

    return {
      changeOrders: pendingChangeOrders,
      signOffs: pendingSignOffs,
    };
  }

  private async getPendingChangeOrdersForUser(user: User): Promise<ChangeOrder[]> {
    const queryBuilder = this.changeOrderRepository
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy');

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

  private async getPendingSignOffsForUser(user: User): Promise<SignOff[]> {
    const queryBuilder = this.signOffRepository
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.requestedBy', 'requestedBy')
      .leftJoinAndSelect('so.changeOrder', 'changeOrder')
      .leftJoinAndSelect('so.dailyReport', 'dailyReport')
      .leftJoinAndSelect('so.delivery', 'delivery')
      .where('so.status = :status', { status: SignOffStatus.PENDING })
      .andWhere(
        '(so.changeOrderId IS NULL OR so.processVersion = changeOrder.signOffProcessVersion)',
      );

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
    const queryBuilder = this.changeOrderRepository
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.createdBy', 'createdBy')
      .leftJoin('co.signOffs', 'so', 'so.processVersion = co.signOffProcessVersion')
      .where('co.status IN (:...statuses)', {
        statuses: [
          ChangeOrderStatus.SUBMITTED,
          ChangeOrderStatus.UNDER_REVIEW,
          ChangeOrderStatus.IN_PROGRESS,
        ],
      })
      .andWhere('(so.id IS NULL OR so.status != :signedStatus)', { signedStatus: 'signed' });

    if (user.role !== Role.ADMIN) {
      queryBuilder.andWhere(
        '(so.signerRole IS NULL OR so.signerRole = :userRole)',
        { userRole: user.role },
      );
    }

    return queryBuilder
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
    const myPendingSignOffs = await this.countMyPendingSignOffs(user);
    const myRequestedSignOffs = await this.getMyRequestedSignOffs(user);
    const myChangeOrders = await this.getMyDraftChangeOrders(user);

    return {
      pendingSignOffCount: myPendingSignOffs,
      requestedSignOffs: myRequestedSignOffs,
      draftChangeOrders: myChangeOrders,
    };
  }

  private async countMyPendingSignOffs(user: User): Promise<number> {
    const queryBuilder = this.signOffRepository
      .createQueryBuilder('so')
      .leftJoin('so.changeOrder', 'co')
      .where('so.status = :status', { status: SignOffStatus.PENDING })
      .andWhere(
        '(so.changeOrderId IS NULL OR so.processVersion = co.signOffProcessVersion)',
      );

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

    return queryBuilder.getCount();
  }

  private async getMyRequestedSignOffs(user: User): Promise<SignOff[]> {
    return this.signOffRepository
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.changeOrder', 'co')
      .where('so.requestedById = :userId', { userId: user.id })
      .andWhere('so.status = :status', { status: SignOffStatus.PENDING })
      .andWhere(
        '(so.changeOrderId IS NULL OR so.processVersion = co.signOffProcessVersion)',
      )
      .orderBy('so.createdAt', 'DESC')
      .take(5)
      .getMany();
  }

  private async getMyDraftChangeOrders(user: User): Promise<ChangeOrder[]> {
    return this.changeOrderRepository.find({
      where: {
        createdById: user.id,
        status: ChangeOrderStatus.DRAFT,
      },
      order: { updatedAt: 'DESC' },
      take: 5,
    });
  }
}
