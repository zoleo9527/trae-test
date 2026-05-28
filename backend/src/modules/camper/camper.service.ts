import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camper } from '../../entities';

@Injectable()
export class CamperService {
  constructor(
    @InjectRepository(Camper)
    private camperRepository: Repository<Camper>,
  ) {}

  async findAll(): Promise<Camper[]> {
    return this.camperRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Camper> {
    return this.camperRepository.findOne({
      where: { id },
      relations: ['checkIns', 'medicalReports', 'materialDistributions', 'resupplyRequests'],
    });
  }

  async create(data: Partial<Camper>): Promise<Camper> {
    const camper = this.camperRepository.create(data);
    return this.camperRepository.save(camper);
  }

  async update(id: string, data: Partial<Camper>): Promise<Camper> {
    await this.camperRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.camperRepository.delete(id);
  }

  async assignRoom(camperId: string, roomId: string, bedNumber: number): Promise<Camper> {
    await this.camperRepository.update(camperId, { roomId, bedNumber });
    return this.findOne(camperId);
  }

  async unassignRoom(camperId: string): Promise<Camper> {
    await this.camperRepository.update(camperId, { roomId: null, bedNumber: null });
    return this.findOne(camperId);
  }

  async getStats(): Promise<any> {
    const total = await this.camperRepository.count();
    const active = await this.camperRepository.count({ where: { status: 'active' } });
    const assigned = await this.camperRepository
      .createQueryBuilder()
      .where('room_id IS NOT NULL')
      .getCount();
    
    return { total, active, assigned, unassigned: total - assigned };
  }
}
