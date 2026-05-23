import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../entities/user.entity';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';
import { UserRole } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { username: data.username } });
    if (existing) {
      throw new BusinessException('用户名已存在', ErrorCode.VALIDATION_ERROR);
    }

    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findAll(queryDto: PaginationDto & { role?: UserRole; keyword?: string }): Promise<PaginatedResult<User>> {
    const { page, limit, sortBy = 'createdAt', sortOrder, role, keyword } = queryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (keyword) {
      queryBuilder.andWhere('(user.name LIKE :keyword OR user.username LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BusinessException('用户不存在', ErrorCode.USER_NOT_FOUND);
    }
    return user;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
