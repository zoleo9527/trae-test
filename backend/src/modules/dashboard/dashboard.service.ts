import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camper, Room, Material, ResupplyRequest, CheckIn, MedicalReport } from '../../entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Camper)
    private camperRepository: Repository<Camper>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(ResupplyRequest)
    private resupplyRepository: Repository<ResupplyRequest>,
    @InjectRepository(CheckIn)
    private checkInRepository: Repository<CheckIn>,
    @InjectRepository(MedicalReport)
    private medicalRepository: Repository<MedicalReport>,
  ) {}

  async getOverview(): Promise<any> {
    const camperStats = await this.getCamperStats();
    const roomStats = await this.getRoomStats();
    const materialStats = await this.getMaterialStats();
    const resupplyStats = await this.getResupplyStats();
    const checkInStats = await this.getCheckInStats();
    const medicalStats = await this.getMedicalStats();

    const recentActivity = await this.getRecentActivity();

    return {
      camperStats,
      roomStats,
      materialStats,
      resupplyStats,
      checkInStats,
      medicalStats,
      recentActivity,
    };
  }

  private async getCamperStats() {
    const total = await this.camperRepository.count();
    const active = await this.camperRepository.count({ where: { status: 'active' } });
    const assigned = await this.camperRepository
      .createQueryBuilder()
      .where('room_id IS NOT NULL')
      .getCount();
    
    return { total, active, assigned, unassigned: total - assigned };
  }

  private async getRoomStats() {
    const totalRooms = await this.roomRepository.count();
    const totalBeds = await this.roomRepository
      .createQueryBuilder()
      .select('SUM(bed_count)', 'sum')
      .getRawOne();
    
    const assignedCampers = await this.camperRepository
      .createQueryBuilder()
      .where('room_id IS NOT NULL')
      .getCount();

    return {
      totalRooms,
      totalBeds: parseInt(totalBeds.sum) || 0,
      assignedCampers,
      occupancyRate: totalBeds.sum > 0 ? Math.round((assignedCampers / parseInt(totalBeds.sum)) * 100) : 0,
    };
  }

  private async getMaterialStats() {
    const totalMaterials = await this.materialRepository.count({ where: { isActive: true } });
    const lowStock = await this.materialRepository
      .createQueryBuilder()
      .where('stock_quantity < 10')
      .andWhere('is_active = true')
      .getCount();

    return { totalMaterials, lowStock };
  }

  private async getResupplyStats() {
    const pending = await this.resupplyRepository.count({ where: { status: 'pending' } });
    const approved = await this.resupplyRepository.count({ where: { status: 'approved' } });
    const fulfilled = await this.resupplyRepository.count({ where: { status: 'fulfilled' } });
    const total = await this.resupplyRepository.count();

    return { total, pending, approved, fulfilled };
  }

  private async getCheckInStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = await this.checkInRepository
      .createQueryBuilder()
      .where('DATE(activity_date) = DATE(:today)', { today })
      .getMany();
    
    const checkedIn = todayRecords.filter(r => r.checkedIn).length;

    return { todayTotal: todayRecords.length, todayCheckedIn: checkedIn, todayPending: todayRecords.length - checkedIn };
  }

  private async getMedicalStats() {
    const pending = await this.medicalRepository.count({ where: { status: 'pending' } });
    const total = await this.medicalRepository.count();

    return { total, pending };
  }

  private async getRecentActivity(): Promise<any[]> {
    const resupply = await this.resupplyRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['camper', 'material'],
    });

    const medical = await this.medicalRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['camper'],
    });

    const activities = [
      ...resupply.map(r => ({
        type: 'resupply',
        id: r.id,
        title: `${r.camper?.name || '未知'} - ${r.material?.name || '物资'}补领`,
        status: r.status,
        time: r.createdAt,
      })),
      ...medical.map(m => ({
        type: 'medical',
        id: m.id,
        title: `${m.camper?.name || '未知'} - ${m.symptom}`,
        status: m.status,
        time: m.createdAt,
      })),
    ];

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
  }
}
