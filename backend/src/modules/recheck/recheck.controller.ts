import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RecheckService } from './recheck.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('rechecks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecheckController {
  constructor(private recheckService: RecheckService) {}

  @Get('complaint/:complaintId')
  findByComplaintId(@Param('complaintId') complaintId: string) {
    return this.recheckService.findByComplaintId(complaintId);
  }

  @Post()
  @Roles('manager', 'picker')
  create(@Body() data: any, @Request() req) {
    return this.recheckService.create(data, req.user.id);
  }
}
