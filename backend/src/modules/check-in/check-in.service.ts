import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from '../../entities';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckIn)
    private checkInRepository: Repository<CheckIn>,
  ) {}

  async findAll(activityDate?: string): Promise<CheckIn[]> {
    const where = activityDate ? { activityDate: new Date(activityDate) } : {};
    return this.checkInRepository.find({
      where,
      relations: ['camper'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCamper(camperId: string): Promise<CheckIn[]> {
    return this.checkInRepository.find({
      where: { camperId },
      order: { activityDate: 'DESC' },
    });
  }

  async create(data: Partial<CheckIn>): Promise<CheckIn> {
    const checkIn = this.checkInRepository.create(data);
    return this.checkInRepository.save(checkIn);
  }

  async checkIn(id: string, data: { checkedInBy: string; remark?: string }): Promise<CheckIn> {
    await this.checkInRepository.update(id, {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: data.checkedInBy,
      remark: data.remark,
    });
    return this.checkInRepository.findOne({ where: { id } });
  }

  async getStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const total = await this.checkInRepository.count();
    const todayRecords = await this.checkInRepository
      .createQueryBuilder()
      .where('DATE(activity_date) = DATE(:today)', { today })
      .getMany();
    
    const checkedIn = todayRecords.filter(r => r.checkedIn).length;

    return { total, todayTotal: todayRecords.length, todayCheckedIn: checkedIn, todayPending: todayRecords.length - checkedIn };
  }

  async batchCreate(activity: string, activityDate: Date, camperIds: string[]): Promise<CheckIn[]> {
    const records = camperIds.map(camperId => ({
      camperId,
      activity,
      activityDate,
      checkedIn: false,
    }));
    
    const saved = this.checkInRepository.create(records);
    return this.checkInRepository.save(saved);
  }
}
