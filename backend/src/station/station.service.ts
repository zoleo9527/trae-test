import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StationStatus, TaskType, TaskStatus } from '@prisma/client';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  async getStationOverview() {
    const stations = await this.prisma.station.findMany({
      include: {
        supplies: true,
        devices: { where: { resolved: false } },
        _count: {
          select: {
            verifications: true,
            devices: true,
          },
        },
      },
    });

    const overview = stations.map((station) => {
      const lowSupplies = station.supplies.filter(
        (s) => s.currentQty <= s.warningQty
      );

      const warningLevel = this.calculateWarningLevel({
        status: station.status,
        unresolvedDevices: station.devices.length,
        lowSupplies: lowSupplies.length,
      });

      return {
        ...station,
        lowSupplies,
        warningLevel,
      };
    });

    return overview;
  }

  private calculateWarningLevel(data: {
    status: StationStatus;
    unresolvedDevices: number;
    lowSupplies: number;
  }): number {
    let level = 0;

    if (data.status === StationStatus.ABNORMAL) level += 3;
    else if (data.status === StationStatus.WARNING) level += 2;
    else if (data.status === StationStatus.MAINTENANCE) level += 1;

    level += data.unresolvedDevices * 2;
    level += data.lowSupplies;

    return Math.min(level, 5);
  }

  async checkStationAnomalies(stationId: string) {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      include: {
        supplies: true,
        devices: { where: { resolved: false } },
        verifications: {
          take: 10,
          orderBy: { verifyTime: 'desc' },
        },
      },
    });

    if (!station) return null;

    const anomalies = [];

    if (station.devices.length > 0) {
      anomalies.push({
        type: 'DEVICE_ISSUES',
        severity: 'high',
        message: `存在 ${station.devices.length} 个未解决的设备故障`,
        details: station.devices,
      });
    }

    const lowSupplies = station.supplies.filter(
      (s) => s.currentQty <= s.warningQty
    );
    if (lowSupplies.length > 0) {
      anomalies.push({
        type: 'LOW_SUPPLIES',
        severity: 'medium',
        message: `${lowSupplies.length} 种耗材库存不足`,
        details: lowSupplies,
      });
    }

    const recentFailed = station.verifications.filter(
      (v) => v.status === 'FAILED'
    ).length;
    if (recentFailed >= 3) {
      anomalies.push({
        type: 'HIGH_FAILURE_RATE',
        severity: 'high',
        message: `近10次核销中有 ${recentFailed} 次失败`,
      });
    }

    return {
      stationId,
      stationName: station.name,
      anomalies,
      overallRisk: anomalies.some((a) => a.severity === 'high')
        ? 'high'
        : anomalies.some((a) => a.severity === 'medium')
        ? 'medium'
        : 'low',
    };
  }

  async escalateStationIssue(stationId: string, reason: string) {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) return null;

    return this.prisma.$transaction(async (tx) => {
      await tx.station.update({
        where: { id: stationId },
        data: {
          status: StationStatus.ABNORMAL,
          warningLevel: 5,
        },
      });

      const task = await tx.task.create({
        data: {
          type: TaskType.STATION_INSPECTION,
          stationId,
          title: `站点异常紧急处理 - ${station.name}`,
          description: reason,
          status: TaskStatus.PENDING,
          priority: 3,
          escalated: true,
          escalateNote: reason,
        },
      });

      return task;
    });
  }

  async getDashboardStats() {
    const [totalStations, activePackages, pendingRefunds, openTasks] =
      await Promise.all([
        this.prisma.station.count(),
        this.prisma.customerPackage.count({ where: { status: 'ACTIVE' } }),
        this.prisma.refundRequest.count({
          where: { status: { in: ['SUBMITTED', 'CS_REVIEWING', 'INSPECTION_REQUIRED'] } },
        }),
        this.prisma.task.count({
          where: { status: { in: ['UNASSIGNED', 'PENDING', 'IN_PROGRESS'] } },
        }),
      ]);

    const stations = await this.prisma.station.findMany({
      include: {
        _count: { select: { devices: { where: { resolved: false } } } },
        supplies: true,
      },
    });

    const abnormalStations = stations.filter((s) => {
      const hasUnresolved = s._count.devices > 0;
      const hasLowSupply = s.supplies.some((sup) => sup.currentQty <= sup.warningQty);
      return hasUnresolved || hasLowSupply;
    }).length;

    return {
      totalStations,
      abnormalStations,
      activePackages,
      pendingRefunds,
      openTasks,
    };
  }
}
