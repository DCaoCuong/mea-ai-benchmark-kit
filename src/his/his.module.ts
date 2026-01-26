import { Module } from '@nestjs/common';
import { HisController } from './his.controller';
import { HisService } from './his.service';

@Module({
    controllers: [HisController],
    providers: [HisService],
    exports: [HisService],
})
export class HisModule { }
