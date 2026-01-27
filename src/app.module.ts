import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AnalyzeModule } from './analyze/analyze.module';
import { SttModule } from './stt/stt.module';
import { BookingModule } from './booking/booking.module';
import { SessionModule } from './session/session.module';
import { PatientModule } from './patient/patient.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ComparisonModule } from './comparison/comparison.module';
import { HisModule } from './his/his.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AnalyzeModule,
    SttModule,
    BookingModule,
    SessionModule,
    PatientModule,
    MedicalRecordModule,
    DashboardModule,
    ComparisonModule,
    HisModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
