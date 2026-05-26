import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.customerService.findAll({ page: +page, pageSize: +pageSize }, keyword);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.customerService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.customerService.update(+id, dto, operator);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.customerService.remove(+id, operator);
  }
}
