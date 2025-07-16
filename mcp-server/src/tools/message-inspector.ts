import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KafkaClientManager } from '../kafka/client.js';
import { Consumer } from 'kafkajs';
import { MessageSample } from '../types/kafka.js';

export class MessageInspectorTool {
  constructor(private clientManager: KafkaClientManager) {}

  getTool(): Tool {
    return {
      name: 'inspect_messages',
      description: 'Inspect recent messages from a Kafka topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic name to inspect messages from'
          },
          partition: {
            type: 'number',
            description: 'Specific partition to read from (optional)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of messages to retrieve (default: 10, max: 100)'
          },
          fromOffset: {
            type: 'string',
            description: 'Offset to start reading from (latest, earliest, or specific number)'
          }
        },
        required: ['topic']
      }
    };
  }

  async execute(args: { 
    topic: string; 
    partition?: number; 
    limit?: number; 
    fromOffset?: string 
  }): Promise<any> {
    const consumer = this.clientManager.getKafka().consumer({ 
      groupId: `mcp-inspector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
    });

    try {
      await consumer.connect();
      
      const limit = Math.min(args.limit || 10, 100);
      const messages: MessageSample[] = [];

      await consumer.subscribe({ topic: args.topic });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for messages'));
        }, 30000); // 30 second timeout

        consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            if (args.partition !== undefined && partition !== args.partition) {
              return;
            }

            const sample: MessageSample = {
              partition,
              offset: parseInt(message.offset),
              key: message.key?.toString(),
              value: this.parseMessageValue(message.value),
              timestamp: new Date(parseInt(message.timestamp)),
              headers: this.parseHeaders(message.headers)
            };

            messages.push(sample);

            if (messages.length >= limit) {
              clearTimeout(timeout);
              resolve({
                topic: args.topic,
                messages,
                sampleSize: messages.length,
                requestedLimit: limit,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      });

    } catch (error) {
      throw new Error(`Failed to inspect messages: ${error}`);
    } finally {
      try {
        await consumer.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }

  private parseMessageValue(value: Buffer | null): any {
    if (!value) return null;
    
    const stringValue = value.toString();
    try {
      return JSON.parse(stringValue);
    } catch {
      return stringValue;
    }
  }

  private parseHeaders(headers: any): Record<string, string> | undefined {
    if (!headers) return undefined;
    
    const parsed: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      parsed[key] = value ? value.toString() : '';
    }
    return parsed;
  }
}