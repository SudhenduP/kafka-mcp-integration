import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { KafkaClientManager } from './kafka/client.js';
import { KafkaAdminService } from './kafka/admin.js';
import { ToolRegistry } from './tools/index.js';
import { KafkaConfig } from './types/kafka.js';

export class KafkaMCPServer {
  private server: Server;
  private clientManager: KafkaClientManager;
  private adminService: KafkaAdminService;
  private toolRegistry: ToolRegistry;

  constructor(kafkaConfig: KafkaConfig) {
    this.server = new Server({
      name: 'kafka-mcp-server',
      version: '1.0.0',
    });

    this.clientManager = new KafkaClientManager(kafkaConfig);
    this.adminService = new KafkaAdminService(this.clientManager);
    this.toolRegistry = new ToolRegistry(this.adminService, this.clientManager);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolRegistry.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.toolRegistry.executeTool(name, args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool '${name}': ${error}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    try {
      await this.adminService.connect();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    } catch (error) {
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    await this.adminService.disconnect();
  }
}