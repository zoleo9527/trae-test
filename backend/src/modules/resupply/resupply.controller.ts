import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ResupplyService } from './resupply.service';
import { ResupplyRequest, EvidenceChain } from '../../entities';

@Controller('resupply')
export class ResupplyController {
  constructor(private readonly resupplyService: ResupplyService) {}

  @Get()
  findAll(@Query('status') status?: string): Promise<ResupplyRequest[]> {
    return this.resupplyService.findAll(status);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.resupplyService.getStats();
  }

  @Get('my-tasks')
  getMyTasks(@Query('role') role: string): Promise<ResupplyRequest[]> {
    return this.resupplyService.getMyTasks(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ResupplyRequest> {
    return this.resupplyService.findOne(id);
  }

  @Get(':id/evidence')
  getEvidenceChain(@Param('id') id: string): Promise<EvidenceChain[]> {
    return this.resupplyService.getEvidenceChain(id);
  }

  @Post()
  create(@Body() data: Partial<ResupplyRequest>): Promise<ResupplyRequest> {
    return this.resupplyService.create(data);
  }

  @Post(':id/review')
  review(
    @Param('id') id: string,
    @Body() body: { action: string; operator: string; reason?: string },
  ): Promise<ResupplyRequest> {
    return this.resupplyService.review(id, body);
  }

  @Post(':id/fulfill')
  fulfill(
    @Param('id') id: string,
    @Body() body: { operator: string; note?: string },
  ): Promise<ResupplyRequest> {
    return this.resupplyService.fulfill(id, body);
  }

  @Post(':id/close')
  close(
    @Param('id') id: string,
    @Body() body: { operator: string; note?: string; parentNotified?: boolean },
  ): Promise<ResupplyRequest> {
    return this.resupplyService.close(id, body);
  }

  @Post(':id/evidence')
  addEvidence(
    @Param('id') id: string,
    @Body() body: { actionType: string; content: string; operator: string; operatorRole: string },
  ): Promise<EvidenceChain> {
    return this.resupplyService.addEvidence(id, body.actionType, body.content, body.operator, body.operatorRole);
  }
}
