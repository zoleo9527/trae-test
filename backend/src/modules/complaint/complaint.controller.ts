import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ComplaintStatus } from '../../common/entities/complaint.entity';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintController {
  constructor(private complaintService: ComplaintService) {}

  @Get()
  findAll(@Query() query: any, @Request() req) {
    return this.complaintService.findAll(query);
  }

  @Get('statistics')
  getStatistics() {
    return this.complaintService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintService.findOne(id);
  }

  @Post()
  @Roles('manager', 'picker')
  create(@Body() data: any, @Request() req) {
    return this.complaintService.create(data, req.user.id);
  }

  @Put(':id/status')
  @Roles('manager', 'picker')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ComplaintStatus; remark?: string },
    @Request() req,
  ) {
    return this.complaintService.updateStatus(id, body.status, req.user.id, body.remark);
  }

  @Post('batch')
  @Roles('manager')
  batchUpdate(@Body() body: { ids: string[]; action: string }, @Request() req) {
    return this.complaintService.batchUpdate(body.ids, body.action, req.user.id);
  }
}
