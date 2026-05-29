import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class UsersService {
  constructor(private db: DbService) {}

  async findAll(): Promise<any[]> {
    return this.db.findAll('users').map(({ password, ...user }) => user);
  }

  async findOne(id: string): Promise<any> {
    const user = this.db.findById('users', id);
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async findByRole(role: string): Promise<any[]> {
    return this.db.find('users', { role }).map(({ password, ...user }) => user);
  }
}
