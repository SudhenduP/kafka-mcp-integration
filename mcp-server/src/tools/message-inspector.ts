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
    let consumer: Consumer | null = null;
    
    try {
      // Check if topic exists first
      const kafka = this.clientManager.getKafka();
      const admin = kafka.admin();
      
      try {
        await admin.connect();
        const topics = await admin.listTopics();
        
        if (!topics.includes(args.topic)) {
          await admin.disconnect();
          return {
            error: `Topic '${args.topic}' does not exist`,
            availableTopics: topics,
            timestamp: new Date().toISOString()
          };
        }
        
        await admin.disconnect();
      } catch (adminError) {
        console.error('Admin connection error:', adminError);
        // Continue anyway, might be a connectivity issue
      }

      // Create consumer with more robust configuration
      const groupId = `mcp-inspector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      consumer = kafka.consumer({ 
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxWaitTimeInMs: 5000,
        retry: {
          retries: 3,
          initialRetryTime: 100,
          maxRetryTime: 30000
        }
      });

      const limit = Math.min(args.limit || 10, 100);
      const messages: MessageSample[] = [];
      let isConnected = false;

      // Connect with timeout
      await Promise.race([
        consumer.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Consumer connection timeout')), 10000)
        )
      ]);
      
      isConnected = true;

      // Subscribe to topic
      await consumer.subscribe({ 
        topic: args.topic,
        fromBeginning: args.fromOffset === 'earliest' || args.fromOffset === '0'
      });

      // Use Promise to handle message collection with proper timeout
      const result = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve({
            topic: args.topic,
            messages: messages.slice(0, limit),
            sampleSize: messages.length,
            requestedLimit: limit,
            timestamp: new Date().toISOString(),
            note: messages.length === 0 ? 'No messages found in the specified time window' : undefined
          });
        }, 15000); // 15 second timeout

        let isResolved = false;

        consumer!.run({
          eachMessage: async ({ topic, partition, message }) => {
            try {
              // Filter by partition if specified
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

              // Stop when we have enough messages
              if (messages.length >= limit && !isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve({
                  topic: args.topic,
                  messages: messages.slice(0, limit),
                  sampleSize: messages.length,
                  requestedLimit: limit,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (messageError) {
              // Continue processing other messages
            }
          }
        }).catch((runError) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            reject(new Error(`Consumer run failed: ${runError.message}`));
          }
        });
      });

      return result;

    } catch (error: any) {
      
      // Provide more specific error messages
      if (error.message && error.message.includes('timeout')) {
        return {
          error: `Timeout while inspecting messages from topic '${args.topic}'`,
          suggestion: 'Try again or check if the topic has recent messages',
          timestamp: new Date().toISOString()
        };
      }
      
      if (error.message && error.message.includes('coordinator')) {
        return {
          error: `Failed to find group coordinator for topic '${args.topic}'`,
          suggestion: 'Check if Kafka cluster is healthy and accessible',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error(`Failed to inspect messages: ${error.message || 'Unknown error'}`);
    } finally {
      // Ensure consumer is properly disconnected
      if (consumer) {
        try {
          await Promise.race([
            consumer.disconnect(),
            new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second timeout for disconnect
          ]);
        } catch (disconnectError) {
          // Don't throw here, just ignore disconnect errors
        }
      }
    }
  }

  private parseMessageValue(value: Buffer | null): any {
    if (!value) return null;
    
    const stringValue = value.toString();
    
    // Try to parse as JSON first
    try {
      return JSON.parse(stringValue);
    } catch {
      // If not JSON, return as string
      return stringValue;
    }
  }

  private parseHeaders(headers: any): Record<string, string> | undefined {
    if (!headers) return undefined;
    
    const parsed: Record<string, string> = {};
    try {
      for (const [key, value] of Object.entries(headers)) {
        if (value && Buffer.isBuffer(value)) {
          parsed[key] = value.toString();
        } else if (value) {
          parsed[key] = value.toString();
        } else {
          parsed[key] = '';
        }
      }
      return Object.keys(parsed).length > 0 ? parsed : undefined;
    } catch (error) {
      return undefined;
    }
  }
}