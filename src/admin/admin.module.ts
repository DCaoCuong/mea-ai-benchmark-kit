import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';
import { PatientModule } from '../patient/patient.module';

@Module({
  imports: [DatabaseModule, PatientModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
