import { Injectable } from '@nestjs/common';
import { StateGraph, END, START } from '@langchain/langgraph';
import { AgentState } from './agent.state';
import { AgentNodesService } from '../services/agent-nodes.service';

@Injectable()
export class MedicalAgentGraphService {
  private compiledGraph: any;

  constructor(private readonly agentNodesService: AgentNodesService) {
    this.initializeGraph();
  }

  private initializeGraph() {
    const graphState = {
      transcript: {
        value: (x: string, y: string) => y ?? x,
        default: () => '',
      },
      soap: {
        value: (x: any, y: any) => (y ? { ...x, ...y } : x),
        default: () => ({
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
        }),
      },
      icdCodes: {
        value: (x: string[], y: string[]) => y ?? x,
        default: () => [],
      },
      medicalAdvice: {
        value: (x: string, y: string) => y ?? x,
        default: () => '',
      },
      references: {
        value: (x: string[], y: string[]) => y ?? x,
        default: () => [],
      },
    };

    // Create the Graph
    const workflow = new StateGraph<AgentState>({
      channels: graphState,
    })
      .addNode('scribe', (state: AgentState) =>
        this.agentNodesService.scribeNode(state),
      )
      .addNode('icd', (state: AgentState) =>
        this.agentNodesService.icdNode(state),
      )
      .addNode('expert', (state: AgentState) =>
        this.agentNodesService.expertNode(state),
      );

    workflow.addEdge(START, 'scribe');

    workflow.addEdge('scribe', 'icd');
    workflow.addEdge('scribe', 'expert');

    workflow.addEdge('icd', END);
    workflow.addEdge('expert', END);

    this.compiledGraph = workflow.compile();
  }

  async invoke(input: { transcript: string }): Promise<AgentState> {
    console.log('Starting Medical Agent Workflow...');
    const result = await this.compiledGraph.invoke(input);
    console.log('Workflow completed!');
    return result;
  }
}
