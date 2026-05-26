import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { ComplaintModule } from './modules/complaint/complaint.module';
import { RecheckModule } from './modules/recheck/recheck.module';
import { CompensationModule } from './modules/compensation/compensation.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin123',
      database: process.env.DB_DATABASE || 'fruit_complaint',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: true,
    }),
    AuthModule,
    ComplaintModule,
    RecheckModule,
    CompensationModule,
    PaymentModule,
  ],
})
export class AppModule {}
