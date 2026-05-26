import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from '../../common/entities/payment.entity';
import { Compensation } from '../../common/entities/compensation.entity';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Compensation, Complaint, StatusLog])],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
