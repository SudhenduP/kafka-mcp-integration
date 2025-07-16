import { ConsumerLagTool } from './consumer-lag.js';
import { TopicHealthTool } from './topic-health.js';
import { MessageInspectorTool } from './message-inspector.js';
import { BrokerPerformanceTool } from './broker-performance.js';
import { KafkaAdminService } from '../kafka/admin.js';
import { KafkaClientManager } from '../kafka/client.js';

export class ToolRegistry {
  private tools: Map<string, any> = new Map();

  constructor(
    private adminService: KafkaAdminService,
    private clientManager: KafkaClientManager
  ) {
    this.initializeTools();
  }

  private initializeTools(): void {
    const consumerLagTool = new ConsumerLagTool(this.adminService);
    const topicHealthTool = new TopicHealthTool(this.adminService);
    const messageInspectorTool = new MessageInspectorTool(this.clientManager);
    const brokerPerformanceTool = new BrokerPerformanceTool(this.adminService);

    this.tools.set('analyze_consumer_lag', consumerLagTool);
    this.tools.set('check_topic_health', topicHealthTool);
    this.tools.set('inspect_messages', messageInspectorTool);
    this.tools.set('analyze_broker_performance', brokerPerformanceTool);
  }

  getTools(): any[] {
    return Array.from(this.tools.values()).map(tool => tool.getTool());
  }

  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }
    return await tool.execute(args);
  }
}