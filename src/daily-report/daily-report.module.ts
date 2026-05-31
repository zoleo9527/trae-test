import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReportService } from './daily-report.service';
import { DailyReportController } from './daily-report.controller';
import { DailyReport } from './entities/daily-report.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyReport]),
    AuditModule,
  ],
  controllers: [DailyReportController],
  providers: [DailyReportService],
  exports: [DailyReportService],
})
export class DailyReportModule {}
