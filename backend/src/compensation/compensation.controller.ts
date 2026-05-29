import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompensationService } from './compensation.service';
import { CreateCompensationDto, UpdateCompensationDto } from './compensation.dto';

@Controller('compensation')
@UseGuards(AuthGuard('jwt'))
export class CompensationController {
  constructor(private compensationService: CompensationService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.compensationService.findAll(query);
  }

  @Get('work-order/:workOrderId')
  async findByWorkOrderId(@Param('workOrderId') workOrderId: string) {
    return this.compensationService.findByWorkOrderId(workOrderId);
  }

  @Post('work-order/:workOrderId')
  async create(
    @Param('workOrderId') workOrderId: string,
    @Body() createDto: CreateCompensationDto,
    @Request() req: any,
  ) {
    return this.compensationService.create(workOrderId, createDto, req.user);
  }

  @Patch('work-order/:workOrderId')
  async update(
    @Param('workOrderId') workOrderId: string,
    @Body() updateDto: UpdateCompensationDto,
    @Request() req: any,
  ) {
    return this.compensationService.update(workOrderId, updateDto, req.user);
  }
}
