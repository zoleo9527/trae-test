import { Controller, Get, Post, Put, Body, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RefundService } from './refund.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';
import { QueryRefundDto } from './dto/query-refund.dto';
import { AddNegotiationDto } from './dto/add-negotiation.dto';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('refunds')
@Controller('refunds')
@UseFilters(BusinessExceptionFilter)
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @ApiOperation({ summary: '创建退款申请' })
  create(@Body() createDto: CreateRefundDto) {
    return this.refundService.create(
      createDto,
      createDto.operatorId,
      createDto.operatorName,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取退款申请列表' })
  findAll(@Query() query: QueryRefundDto) {
    return this.refundService.findAll(query.page, query.limit, {
      status: query.status,
      workOrderId: query.workOrderId,
      initiatorId: query.initiatorId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取退款申请详情' })
  findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新退款状态' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateRefundStatusDto,
  ) {
    return this.refundService.updateStatus(
      id,
      updateDto.status,
      updateDto.operatorId,
      updateDto.operatorName,
      {
        rejectionReason: updateDto.rejectionReason,
        approvedAmount: updateDto.approvedAmount,
        reviewerId: updateDto.reviewerId,
      },
    );
  }

  @Post(':id/negotiations')
  @ApiOperation({ summary: '添加协商记录' })
  addNegotiation(
    @Param('id') id: string,
    @Body() dto: AddNegotiationDto,
  ) {
    return this.refundService.addNegotiationHistory(
      id,
      dto.history,
      dto.operatorId,
      dto.operatorName,
    );
  }
}
