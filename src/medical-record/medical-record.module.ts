import { Module } from '@nestjs/common';
import { MedicalRecordController } from './medical-record.controller';
import { MedicalRecordService } from './medical-record.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [MedicalRecordController],
    providers: [MedicalRecordService],
    exports: [MedicalRecordService],
})
export class MedicalRecordModule { }
