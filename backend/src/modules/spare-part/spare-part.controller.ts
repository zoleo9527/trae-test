import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SparePartService } from './spare-part.service';
import { CreateSparePartDto, UpdateSparePartDto, QuerySparePartDto, CreatePartUsageDto, ApprovePartUsageDto, ReceivePartUsageDto, QueryPartUsageDto } from './dto/spare-part.dto';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage } from '../../entities/part-usage.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Controller('api/spare-parts')
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Post()
  async createPart(@Body() createDto: CreateSparePartDto): Promise<SparePart> {
    return this.sparePartService.createPart(createDto);
  }

  @Get()
  async findAllParts(@Query() queryDto: QuerySparePartDto): Promise<PaginatedResult<SparePart>> {
    return this.sparePartService.findAllParts(queryDto);
  }

  @Get(':id')
  async findOnePart(@Param('id') id: string): Promise<SparePart> {
    return this.sparePartService.findOnePart(id);
  }

  @Put(':id')
  async updatePart(@Param('id') id: string, @Body() updateDto: UpdateSparePartDto): Promise<SparePart> {
    return this.sparePartService.updatePart(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePart(@Param('id') id: string): Promise<void> {
    return this.sparePartService.deletePart(id);
  }
}

@Controller('api/part-usages')
export class PartUsageController {
  constructor(private readonly sparePartService: SparePartService) {}

  @Post()
  async requestPart(@Body() createDto: CreatePartUsageDto): Promise<PartUsage> {
    return this.sparePartService.requestPart(createDto);
  }

  @Get()
  async findAllUsages(@Query() queryDto: QueryPartUsageDto): Promise<PaginatedResult<PartUsage>> {
    return this.sparePartService.findAllUsages(queryDto);
  }

  @Get(':id')
  async findOneUsage(@Param('id') id: string): Promise<PartUsage> {
    return this.sparePartService.findOneUsage(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() approveDto: ApprovePartUsageDto): Promise<PartUsage> {
    return this.sparePartService.approvePartUsage(id, approveDto);
  }

  @Post(':id/receive')
  async receive(@Param('id') id: string, @Body() receiveDto: ReceivePartUsageDto): Promise<PartUsage> {
    return this.sparePartService.receivePartUsage(id, receiveDto);
  }
}
