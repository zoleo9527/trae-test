import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateNegotiationDto, QueryNegotiationDto, UpdateNegotiationStatusDto } from './dto/negotiation.dto';
import { Negotiation } from './negotiation.entity';
import { NegotiationService } from './negotiation.service';

@Controller('api/negotiations')
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Get()
  async findAll(@Query() query: QueryNegotiationDto): Promise<Negotiation[]> {
    return this.negotiationService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Negotiation> {
    return this.negotiationService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateNegotiationDto): Promise<Negotiation> {
    return this.negotiationService.create(dto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body() dto: UpdateNegotiationStatusDto,
  ): Promise<Negotiation> {
    return this.negotiationService.updateStatus(id, dto);
  }
}
