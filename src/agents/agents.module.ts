import { Module } from '@nestjs/common';
import { AgentNodesService } from './services/agent-nodes.service';
import { MedicalAgentGraphService } from './graph/medical-agent-graph.service';
import { RagModule } from '../rag/rag.module';

@Module({
    imports: [RagModule],
    providers: [AgentNodesService, MedicalAgentGraphService],
    exports: [MedicalAgentGraphService],
})
export class AgentsModule { }
