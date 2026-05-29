import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CompensationService } from './compensation.service';
import { CreateCompensationDto, UpdateCompensationDto } from './compensation.dto';

@Controller('compensation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompensationController {
  constructor(private compensationService: CompensationService) {}

  @Get()
  @Roles('owner', 'customer_service')
  async findAll(@Query() query: any, @Request() req: any) {
    return this.compensationService.findAll(query, req.user);
  }

  @Get('work-order/:workOrderId')
  @Roles('owner', 'customer_service')
  async findByWorkOrderId(@Param('workOrderId') workOrderId: string, @Request() req: any) {
    return this.compensationService.findByWorkOrderId(workOrderId, req.user);
  }

  @Post('work-order/:workOrderId')
  @Roles('owner', 'customer_service')
  async create(
    @Param('workOrderId') workOrderId: string,
    @Body() createDto: CreateCompensationDto,
    @Request() req: any,
  ) {
    return this.compensationService.create(workOrderId, createDto, req.user);
  }

  @Patch('work-order/:workOrderId')
  @Roles('owner', 'customer_service')
  async update(
    @Param('workOrderId') workOrderId: string,
    @Body() updateDto: UpdateCompensationDto,
    @Request() req: any,
  ) {
    return this.compensationService.update(workOrderId, updateDto, req.user);
  }
}
