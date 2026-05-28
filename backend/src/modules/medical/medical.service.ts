import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalReport } from '../../entities';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalReport)
    private reportRepository: Repository<MedicalReport>,
  ) {}

  async findAll(status?: string): Promise<MedicalReport[]> {
    const where = status ? { status } : {};
    return this.reportRepository.find({
      where,
      relations: ['camper'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MedicalReport> {
    return this.reportRepository.findOne({
      where: { id },
      relations: ['camper'],
    });
  }

  async findByCamper(camperId: string): Promise<MedicalReport[]> {
    return this.reportRepository.find({
      where: { camperId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<MedicalReport>): Promise<MedicalReport> {
    const report = this.reportRepository.create({
      ...data,
      status: 'pending',
    });
    return this.reportRepository.save(report);
  }

  async handle(id: string, data: { handledBy: string; handlingNote: string; parentNotified?: boolean; parentNotification?: string }): Promise<MedicalReport> {
    await this.reportRepository.update(id, {
      status: 'handled',
      handledBy: data.handledBy,
      handlingNote: data.handlingNote,
      parentNotified: data.parentNotified || false,
      parentNotification: data.parentNotification,
    });
    return this.findOne(id);
  }

  async getStats(): Promise<any> {
    const total = await this.reportRepository.count();
    const pending = await this.reportRepository.count({ where: { status: 'pending' } });
    const handled = await this.reportRepository.count({ where: { status: 'handled' } });

    return { total, pending, handled };
  }
}
