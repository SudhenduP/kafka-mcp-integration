import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KafkaAdminService } from '../kafka/admin.js';
import { ConsumerGroupInfo, ConsumerLagInfo } from '../types/kafka.js';

export class ConsumerLagTool {
  constructor(private adminService: KafkaAdminService) {}

  getTool(): Tool {
    return {
      name: 'analyze_consumer_lag',
      description: 'Analyze consumer lag for a specific topic or all topics',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic name to analyze (optional, analyzes all if not provided)'
          },
          groupId: {
            type: 'string',
            description: 'Consumer group ID to analyze (optional, analyzes all if not provided)'
          }
        }
      }
    };
  }

  async execute(args: { topic?: string; groupId?: string }): Promise<any> {
    try {
      const groups = await this.adminService.listConsumerGroups();
      const groupsToAnalyze = args.groupId 
        ? groups.groups.filter((g: any) => g.groupId === args.groupId)
        : groups.groups;

      const results: ConsumerGroupInfo[] = [];

      for (const group of groupsToAnalyze) {
        const groupDescription = await this.adminService.describeConsumerGroups([group.groupId]);
        const groupOffsets = await this.adminService.getConsumerGroupOffsets(group.groupId);

        const lagInfo: ConsumerLagInfo[] = [];
        let totalLag = 0;

        for (const topicOffset of groupOffsets) {
          if (args.topic && topicOffset.topic !== args.topic) {
            continue;
          }

          const topicOffsets = await this.adminService.getTopicOffsets(topicOffset.topic);

          for (const partition of topicOffset.partitions) {
            const topicPartitionOffset = topicOffsets.find(
              (tp: any) => tp.partition === partition.partition
            );

            if (topicPartitionOffset) {
              const lag = parseInt(topicPartitionOffset.offset) - parseInt(partition.offset);
              totalLag += lag;

              lagInfo.push({
                topic: topicOffset.topic,
                partition: partition.partition,
                currentOffset: parseInt(partition.offset),
                logEndOffset: parseInt(topicPartitionOffset.offset),
                lag: lag,
                consumerId: partition.metadata
              });
            }
          }
        }

        results.push({
          groupId: group.groupId,
          state: groupDescription.groups[0]?.state || 'UNKNOWN',
          members: groupDescription.groups[0]?.members || [],
          totalLag: totalLag,
          partitionLags: lagInfo
        });
      }

      return {
        timestamp: new Date().toISOString(),
        consumerGroups: results,
        analysis: this.generateAnalysis(results),
        recommendations: this.generateRecommendations(results)
      };

    } catch (error) {
      throw new Error(`Failed to analyze consumer lag: ${error}`);
    }
  }

  private generateAnalysis(results: ConsumerGroupInfo[]): any {
    const totalLag = results.reduce((sum, group) => sum + group.totalLag, 0);
    const activeGroups = results.filter(group => group.state === 'Stable').length;
    const problematicGroups = results.filter(group => group.totalLag > 10000).length;

    return {
      totalLag,
      activeGroups,
      problematicGroups,
      status: problematicGroups > 0 ? 'WARNING' : totalLag > 5000 ? 'CAUTION' : 'HEALTHY'
    };
  }

  private generateRecommendations(results: ConsumerGroupInfo[]): string[] {
    const recommendations: string[] = [];

    for (const group of results) {
      if (group.totalLag > 10000) {
        recommendations.push(`Consider scaling up consumer group '${group.groupId}' - high lag detected`);
      }

      const maxLagPartition = group.partitionLags.reduce((max, current) => 
        current.lag > max.lag ? current : max
      );

      if (maxLagPartition.lag > 5000) {
        recommendations.push(`Investigate partition ${maxLagPartition.partition} in topic '${maxLagPartition.topic}' - highest lag detected`);
      }
    }

    return recommendations;
  }
}