import { Module } from '@nestjs/common';
import { SttController } from './stt.controller';
import { SttService } from './stt.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
    imports: [AgentsModule],
    controllers: [SttController],
    providers: [SttService],
    exports: [SttService],
})
export class SttModule { }
