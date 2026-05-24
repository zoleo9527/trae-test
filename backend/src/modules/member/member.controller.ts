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
import { MemberService, CreateMemberDto, UpdateMemberDto } from './member.service';
import { CurrentUser } from '../../common/auth';
import { User } from '../../database/entities';

@Controller('members')
@UseGuards(AuthGuard('jwt'))
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Post()
  create(
    @Body() dto: CreateMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.memberService.create(dto, user);
  }

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('level') level?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.memberService.findAll(
      { keyword, level },
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.memberService.findByPhone(phone);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.memberService.update(id, dto, user);
  }
}
