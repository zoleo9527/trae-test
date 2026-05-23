import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() data: Partial<User>): Promise<User> {
    return this.userService.create(data);
  }

  @Get()
  async findAll(
    @Query() queryDto: PaginationDto & { role?: UserRole; keyword?: string },
  ): Promise<PaginatedResult<User>> {
    return this.userService.findAll(queryDto);
  }

  @Get('role/:role')
  async findByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.userService.findByRole(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<User>): Promise<User> {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.userService.delete(id);
  }
}
