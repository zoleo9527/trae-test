import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRecord } from '../../entities/review-record.entity';
import { WorkOrder } from '../../entities/work-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewRecord, WorkOrder])],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
