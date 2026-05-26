import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  @Roles('manager', 'accountant')
  findAll(@Query() query: any) {
    return this.paymentService.findAll(query);
  }

  @Get('compensation/:compensationId')
  findByCompensationId(@Param('compensationId') compensationId: string) {
    return this.paymentService.findByCompensationId(compensationId);
  }

  @Post()
  @Roles('accountant', 'manager')
  create(@Body() data: any, @Request() req) {
    return this.paymentService.create(data, req.user.id);
  }
}
