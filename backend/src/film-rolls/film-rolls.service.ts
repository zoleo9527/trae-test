import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class FilmRollsService {
  constructor(private db: DbService) {}

  async findAll(query?: any): Promise<any[]> {
    let list = this.db.findAll('filmRolls');

    if (query?.status) {
      list = list.filter((item) => item.status === query.status);
    }

    if (query?.search) {
      const kw = query.search.toLowerCase();
      list = list.filter(
        (item) =>
          item.rollNumber.toLowerCase().includes(kw) ||
          item.customerName.toLowerCase().includes(kw) ||
          item.customerPhone.includes(kw),
      );
    }

    if (query?.isMixed !== undefined) {
      list = list.filter((item) => item.isMixed === (query.isMixed === 'true'));
    }

    return list.sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    );
  }

  async findOne(id: string): Promise<any> {
    const filmRoll = this.db.findById('filmRolls', id);
    if (!filmRoll) {
      throw new NotFoundException('胶卷不存在');
    }
    return filmRoll;
  }

  async findByRollNumber(rollNumber: string): Promise<any> {
    return this.db.findOne('filmRolls', { rollNumber });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    await this.findOne(id);
    return this.db.update('filmRolls', id, { status });
  }
}
