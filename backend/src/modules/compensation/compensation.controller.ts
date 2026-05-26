import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CompensationService } from './compensation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('compensations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompensationController {
  constructor(private compensationService: CompensationService) {}

  @Get()
  @Roles('manager', 'accountant')
  findAll(@Query() query: any) {
    return this.compensationService.findAll(query);
  }

  @Get('complaint/:complaintId')
  findByComplaintId(@Param('complaintId') complaintId: string) {
    return this.compensationService.findByComplaintId(complaintId);
  }

  @Post()
  @Roles('manager')
  create(@Body() data: any) {
    return this.compensationService.create(data);
  }

  @Post(':id/approve')
  @Roles('manager')
  approve(@Param('id') id: string, @Body() body: { remark?: string }, @Request() req) {
    return this.compensationService.approve(id, req.user.id, body.remark);
  }

  @Post(':id/reject')
  @Roles('manager')
  reject(@Param('id') id: string, @Body() body: { remark?: string }, @Request() req) {
    return this.compensationService.reject(id, req.user.id, body.remark);
  }
}
