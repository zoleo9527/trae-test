import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Member, AuditLog } from '../../database/entities';
import { AuditService } from '../../common/audit';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, AuditLog]),
  ],
  controllers: [MemberController],
  providers: [MemberService, AuditService],
  exports: [MemberService],
})
export class MemberModule {}
