import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowUpService, CreateFollowUpDto, CompleteFollowUpDto } from './follow-up.service';
import { CurrentUser } from '../../common/auth';
import { User, FollowUpStatus, FollowUpType } from '../../database/entities';

@Controller('follow-ups')
@UseGuards(AuthGuard('jwt'))
export class FollowUpController {
  constructor(private followUpService: FollowUpService) {}

  @Post()
  create(
    @Body() dto: CreateFollowUpDto,
    @CurrentUser() user: User,
  ) {
    return this.followUpService.create(dto, user);
  }

  @Get()
  findAll(
    @Query('status') status?: FollowUpStatus,
    @Query('type') type?: FollowUpType,
    @Query('memberId') memberId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.followUpService.findAll(
      { status, type, memberId, assignedTo },
      Number(page),
      Number(limit),
    );
  }

  @Get('stats')
  getStats() {
    return this.followUpService.getPendingStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followUpService.findOne(id);
  }

  @Put(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteFollowUpDto,
    @CurrentUser() user: User,
  ) {
    return this.followUpService.complete(id, dto, user);
  }
}
