import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignOffService } from './sign-off.service';
import { SignOffController } from './sign-off.controller';
import { SignOff } from './entities/sign-off.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SignOff]),
    AuditModule,
  ],
  controllers: [SignOffController],
  providers: [SignOffService],
  exports: [SignOffService],
})
export class SignOffModule {}
