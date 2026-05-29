import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from './dto/supplier.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse as ApiResponseType, PaginatedResponse } from '../../common/dto/response.dto';
import { Supplier } from '../../entities/supplier.entity';

@ApiTags('suppliers')
@Controller('api/suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiOperation({ summary: '创建供应商' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSupplierDto): Promise<ApiResponseType<Supplier>> {
    const data = await this.supplierService.create(createDto);
    return new ApiResponseType(data, 'Supplier created successfully');
  }

  @Get()
  @ApiOperation({ summary: '获取供应商列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: SupplierQueryDto,
  ): Promise<ApiResponseType<PaginatedResponse<Supplier>>> {
    const data = await this.supplierService.findAll(pagination, filters);
    return new ApiResponseType(data);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取供应商详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponseType<Supplier>> {
    const data = await this.supplierService.findOne(id);
    return new ApiResponseType(data);
  }

  @Get('code/:code')
  @ApiOperation({ summary: '根据编码获取供应商' })
  async findByCode(@Param('code') code: string): Promise<ApiResponseType<Supplier>> {
    const data = await this.supplierService.findByCode(code);
    return new ApiResponseType(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新供应商' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSupplierDto,
  ): Promise<ApiResponseType<Supplier>> {
    const data = await this.supplierService.update(id, updateDto);
    return new ApiResponseType(data, 'Supplier updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除供应商' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.supplierService.remove(id);
  }
}
