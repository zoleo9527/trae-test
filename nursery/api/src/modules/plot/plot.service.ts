import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlotDto, QueryPlotDto } from './dto/plot.dto';
import { Plot } from './plot.entity';

@Injectable()
export class PlotService {
  constructor(
    @InjectRepository(Plot)
    private readonly plotRepository: Repository<Plot>,
  ) {}

  async findAll(query?: QueryPlotDto): Promise<Plot[]> {
    const qb = this.plotRepository.createQueryBuilder('plot')
      .leftJoinAndSelect('plot.inspector', 'inspector');

    if (query?.name) {
      qb.andWhere('plot.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query?.location) {
      qb.andWhere('plot.location LIKE :location', { location: `%${query.location}%` });
    }
    if (query?.variety) {
      qb.andWhere('plot.variety LIKE :variety', { variety: `%${query.variety}%` });
    }
    if (query?.inspectorId) {
      qb.andWhere('plot.inspectorId = :inspectorId', { inspectorId: query.inspectorId });
    }

    qb.orderBy('plot.id', 'DESC');
    return qb.getMany();
  }

  async findOne(id: number): Promise<Plot> {
    return this.plotRepository.findOne({
      where: { id },
      relations: ['inspector'],
    });
  }

  async create(dto: CreatePlotDto): Promise<Plot> {
    const plot = this.plotRepository.create(dto);
    return this.plotRepository.save(plot);
  }

  async update(id: number, dto: Partial<CreatePlotDto>): Promise<Plot> {
    await this.plotRepository.update(id, dto);
    return this.findOne(id);
  }
}
