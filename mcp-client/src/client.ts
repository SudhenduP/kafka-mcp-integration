import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export class KafkaMCPClient {
  private client: Client;
  private transport?: StdioClientTransport;

  constructor(private serverPath: string) {
    this.client = new Client({
      name: 'kafka-mcp-client',
      version: '1.0.0',
    });
  }

  async connect(): Promise<void> {
    // Start the MCP server process
    const serverProcess = spawn('node', [this.serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.transport = new StdioClientTransport({
      command: 'node',
      args: [this.serverPath],
    });

    await this.client.connect(this.transport);
    console.log('Connected to Kafka MCP Server');
  }

  async listTools(): Promise<any> {
    const response = await this.client.listTools();
    return response;
  }

  async callTool(name: string, args: any = {}): Promise<any> {
    const response = await this.client.callTool({
      name,
      arguments: args,
    });
    return response;
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.client.close();
    }
    console.log('Disconnected from Kafka MCP Server');
  }
}