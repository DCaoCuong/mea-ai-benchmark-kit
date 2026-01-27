import { Module } from '@nestjs/common';
import { ComparisonController } from './comparison.controller';
import { ComparisonService } from './comparison.service';
import { ComparisonAgentService } from './comparison-agent.service';
import { DatabaseModule } from '../database/database.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [DatabaseModule, RagModule],
  controllers: [ComparisonController],
  providers: [ComparisonService, ComparisonAgentService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
