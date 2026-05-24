import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultant } from './consultant.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ConsultantService {
  constructor(
    @InjectRepository(Consultant)
    private readonly consultantRepository: Repository<Consultant>,
  ) {}

  async create(data: Partial<Consultant>): Promise<Consultant> {
    const consultant = this.consultantRepository.create(data);
    return this.consultantRepository.save(consultant);
  }

  async findAll(role?: Role): Promise<Consultant[]> {
    const where: any = { isActive: true };
    if (role) where.role = role;

    return this.consultantRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Consultant> {
    return this.consultantRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<Consultant> {
    return this.consultantRepository.findOne({ where: { username } });
  }
}
