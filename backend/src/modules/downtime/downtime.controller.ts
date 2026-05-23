import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DowntimeService } from './downtime.service';
import { CreateDowntimeDto, UpdateDowntimeDto, ConfirmDowntimeDto, QueryDowntimeDto } from './dto/downtime.dto';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Controller('api/downtime')
export class DowntimeController {
  constructor(private readonly downtimeService: DowntimeService) {}

  @Post()
  async create(@Body() createDto: CreateDowntimeDto): Promise<DowntimeRecord> {
    return this.downtimeService.create(createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryDowntimeDto): Promise<PaginatedResult<DowntimeRecord>> {
    return this.downtimeService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DowntimeRecord> {
    return this.downtimeService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDowntimeDto): Promise<DowntimeRecord> {
    return this.downtimeService.update(id, updateDto);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Body() confirmDto: ConfirmDowntimeDto): Promise<DowntimeRecord> {
    return this.downtimeService.confirm(id, confirmDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.downtimeService.delete(id);
  }
}
