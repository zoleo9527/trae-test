import { Controller, Get, Post, Put, Body, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { QueryTransferDto } from './dto/query-transfer.dto';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('transfers')
@Controller('transfers')
@UseFilters(BusinessExceptionFilter)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({ summary: '创建顾问交接' })
  create(@Body() createDto: CreateTransferDto) {
    return this.transferService.create(
      createDto,
      createDto.operatorId,
      createDto.operatorName,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取交接列表' })
  findAll(@Query() query: QueryTransferDto) {
    return this.transferService.findAll(query.page, query.limit, {
      status: query.status,
      workOrderId: query.workOrderId,
      fromConsultantId: query.fromConsultantId,
      toConsultantId: query.toConsultantId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取交接详情' })
  findOne(@Param('id') id: string) {
    return this.transferService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新交接状态' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransferStatusDto,
  ) {
    return this.transferService.updateStatus(
      id,
      updateDto.status,
      updateDto.operatorId,
      updateDto.operatorName,
      {
        rejectionReason: updateDto.rejectionReason,
      },
    );
  }

  @Put(':id/handover')
  @ApiOperation({ summary: '更新交接内容' })
  updateHandover(
    @Param('id') id: string,
    @Body() data: { handoverContent?: string; keyNotes?: string; pendingItems?: string },
  ) {
    return this.transferService.updateHandoverContent(
      id,
      data,
      data['operatorId'],
      data['operatorName'] || 'System',
    );
  }
}
