import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { CommonModule } from './common/common.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { ProjectModule } from './modules/project/project.module';
import { PersonModule } from './modules/person/person.module';
import { CredentialModule } from './modules/credential/credential.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { MaterialModule } from './modules/material/material.module';
import { SettlementModule } from './modules/settlement/settlement.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    CommonModule,
    SupplierModule,
    ProjectModule,
    PersonModule,
    CredentialModule,
    CheckinModule,
    MaterialModule,
    SettlementModule,
  ],
})
export class AppModule {}
