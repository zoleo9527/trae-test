import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DiseaseTimeline } from './modules/disease/disease-timeline.entity';
import { Disease } from './modules/disease/disease.entity';
import { DiseaseModule } from './modules/disease/disease.module';
import { Inspection } from './modules/inspection/inspection.entity';
import { InspectionModule } from './modules/inspection/inspection.module';
import { Negotiation } from './modules/negotiation/negotiation.entity';
import { NegotiationModule } from './modules/negotiation/negotiation.module';
import { Plot } from './modules/plot/plot.entity';
import { PlotModule } from './modules/plot/plot.module';
import { User } from './modules/user/user.entity';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'nursery',
      synchronize: true,
      entities: [User, Plot, Inspection, Disease, DiseaseTimeline, Negotiation],
    }),
    UserModule,
    PlotModule,
    InspectionModule,
    DiseaseModule,
    NegotiationModule,
    DashboardModule,
  ],
})
export class AppModule {}
