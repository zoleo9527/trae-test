import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { SubmitRefundDto, CsReviewDto, InspectionSubmitDto, FinalReviewDto } from './dto/refund-flow.dto';
import { BatchReviewDto } from './dto/batch-review.dto';
import { RefundStatus } from '@prisma/client';

@Controller('api/workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('refund/submit')
  submitRefund(@Body() dto: SubmitRefundDto) {
    return this.workflowService.submitRefund(dto);
  }

  @Post('refund/cs-review')
  csReview(@Body() dto: CsReviewDto) {
    return this.workflowService.csReview(dto);
  }

  @Post('refund/inspection')
  submitInspection(@Body() dto: InspectionSubmitDto) {
    return this.workflowService.submitInspection(dto);
  }

  @Post('refund/final')
  finalReview(@Body() dto: FinalReviewDto) {
    return this.workflowService.finalReview(dto);
  }

  @Post('refund/batch')
  batchReview(@Body() dto: BatchReviewDto) {
    return this.workflowService.batchReview(dto);
  }

  @Get('refunds')
  getRefundList(
    @Query('status') status?: RefundStatus,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.workflowService.getRefundList(status, parseInt(page), parseInt(limit));
  }

  @Get('refund/:id/timeline')
  getRefundTimeline(@Param('id') id: string) {
    return this.workflowService.getRefundTimeline(id);
  }
}
