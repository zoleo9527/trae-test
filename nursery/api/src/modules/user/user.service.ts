import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto, QueryUserDto } from './dto/user.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query?: QueryUserDto): Promise<User[]> {
    const qb = this.userRepository.createQueryBuilder('user');

    if (query?.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (query?.name) {
      qb.andWhere('user.name LIKE :name', { name: `%${query.name}%` });
    }

    qb.orderBy('user.id', 'ASC');
    return qb.getMany();
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  async getByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }
}
