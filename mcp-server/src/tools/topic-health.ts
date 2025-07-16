import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KafkaAdminService } from '../kafka/admin.js';
import { TopicHealthInfo } from '../types/kafka.js';

export class TopicHealthTool {
  constructor(private adminService: KafkaAdminService) {}

  getTool(): Tool {
    return {
      name: 'check_topic_health',
      description: 'Check the health status of Kafka topics',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic name to check (optional, checks all if not provided)'
          }
        }
      }
    };
  }

  async execute(args: { topic?: string }): Promise<any> {
    try {
      const topics = args.topic ? [args.topic] : await this.adminService.listTopics();
      const results: TopicHealthInfo[] = [];

      for (const topic of topics) {
        const topicMetadata = await this.adminService.describeTopics([topic]);
        const topicInfo = topicMetadata.topics[0];

        if (!topicInfo) {
          continue;
        }

        const partitionCount = topicInfo.partitions.length;
        const replicationFactor = topicInfo.partitions[0]?.replicas?.length || 1;

        // Get topic offsets to calculate message rate
        const topicOffsets = await this.adminService.getTopicOffsets(topic);
        const totalMessages = topicOffsets.reduce((sum: number, partition: any) => 
          sum + parseInt(partition.offset), 0
        );

        // Check for issues
        const issues: string[] = [];
        let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

        // Check replication factor
        if (replicationFactor < 2) {
          issues.push('Low replication factor - risk of data loss');
          status = 'WARNING';
        }

        // Check for under-replicated partitions
        const underReplicatedPartitions = topicInfo.partitions.filter(
          (p: any) => p.isr.length < p.replicas.length
        );

        if (underReplicatedPartitions.length > 0) {
          issues.push(`${underReplicatedPartitions.length} under-replicated partitions`);
          status = 'CRITICAL';
        }

        // Check partition balance
        const partitionSizes = topicOffsets.map((p: any) => parseInt(p.offset));
        const avgSize = partitionSizes.reduce((a: number, b: number) => a + b, 0) / partitionSizes.length;
        const imbalancedPartitions = partitionSizes.filter((size: number) => 
          Math.abs(size - avgSize) > avgSize * 0.2
        );

        if (imbalancedPartitions.length > 0) {
          issues.push('Partition imbalance detected');
          if (status === 'HEALTHY') status = 'WARNING';
        }

        results.push({
          topic,
          partitions: partitionCount,
          replicationFactor,
          messageRate: this.calculateMessageRate(totalMessages), // Simplified
          bytesRate: this.calculateBytesRate(totalMessages), // Simplified
          status,
          issues
        });
      }

      return {
        timestamp: new Date().toISOString(),
        topics: results,
        summary: this.generateSummary(results)
      };

    } catch (error) {
      throw new Error(`Failed to check topic health: ${error}`);
    }
  }

  private calculateMessageRate(totalMessages: number): number {
    // Simplified calculation - in real implementation, 
    // you'd track this over time
    return Math.floor(totalMessages / 3600); // Messages per hour
  }

  private calculateBytesRate(totalMessages: number): number {
    // Simplified calculation - assume average message size
    const avgMessageSize = 1024; // 1KB
    return totalMessages * avgMessageSize;
  }

  private generateSummary(results: TopicHealthInfo[]): any {
    const healthyCount = results.filter(t => t.status === 'HEALTHY').length;
    const warningCount = results.filter(t => t.status === 'WARNING').length;
    const criticalCount = results.filter(t => t.status === 'CRITICAL').length;

    return {
      totalTopics: results.length,
      healthy: healthyCount,
      warning: warningCount,
      critical: criticalCount,
      overallStatus: criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'HEALTHY'
    };
  }
}