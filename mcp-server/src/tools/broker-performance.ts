import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KafkaAdminService } from '../kafka/admin.js';
import { BrokerInfo } from '../types/kafka.js';

export class BrokerPerformanceTool {
  constructor(private adminService: KafkaAdminService) {}

  getTool(): Tool {
    return {
      name: 'analyze_broker_performance',
      description: 'Analyze Kafka broker performance and health',
      inputSchema: {
        type: 'object',
        properties: {
          brokerId: {
            type: 'number',
            description: 'Specific broker ID to analyze (optional, analyzes all if not provided)'
          }
        }
      }
    };
  }

  async execute(args: { brokerId?: number }): Promise<any> {
    try {
      const brokers = await this.adminService.getBrokers();
      const brokersToAnalyze = args.brokerId 
        ? brokers.filter(b => b.id === args.brokerId)
        : brokers;

      const results = [];

      for (const broker of brokersToAnalyze) {
        const brokerMetrics = await this.getBrokerMetrics(broker);
        const leaderPartitions = await this.getLeaderPartitionCount(broker.id);
        const replicaPartitions = await this.getReplicaPartitionCount(broker.id);

        results.push({
          brokerId: broker.id,
          host: broker.host,
          port: broker.port,
          status: broker.status,
          metrics: brokerMetrics,
          leaderPartitions,
          replicaPartitions,
          health: this.assessBrokerHealth(brokerMetrics)
        });
      }

      return {
        timestamp: new Date().toISOString(),
        brokers: results,
        clusterHealth: this.assessClusterHealth(results),
        recommendations: this.generateRecommendations(results)
      };

    } catch (error) {
      throw new Error(`Failed to analyze broker performance: ${error}`);
    }
  }

  private async getBrokerMetrics(broker: BrokerInfo): Promise<any> {
    // In a real implementation, this would connect to JMX or use Kafka's metrics APIs
    // For demo purposes, we'll simulate metrics
    return {
      cpuUsage: Math.random() * 80 + 10, // 10-90%
      memoryUsage: Math.random() * 60 + 20, // 20-80%
      diskUsage: Math.random() * 70 + 15, // 15-85%
      networkIO: {
        bytesInPerSec: Math.floor(Math.random() * 100000000), // Random bytes/sec
        bytesOutPerSec: Math.floor(Math.random() * 90000000)
      },
      requestRate: Math.floor(Math.random() * 10000), // Requests per second
      errorRate: Math.random() * 5 // 0-5% error rate
    };
  }

  private async getLeaderPartitionCount(brokerId: number): Promise<number> {
    // Simplified - in real implementation, would query metadata
    return Math.floor(Math.random() * 50) + 20;
  }

  private async getReplicaPartitionCount(brokerId: number): Promise<number> {
    // Simplified - in real implementation, would query metadata
    return Math.floor(Math.random() * 150) + 50;
  }

  private assessBrokerHealth(metrics: any): string {
    if (metrics.cpuUsage > 80 || metrics.memoryUsage > 85 || metrics.errorRate > 3) {
      return 'CRITICAL';
    } else if (metrics.cpuUsage > 60 || metrics.memoryUsage > 70 || metrics.errorRate > 1) {
      return 'WARNING';
    }
    return 'HEALTHY';
  }

  private assessClusterHealth(brokers: any[]): any {
    const healthyBrokers = brokers.filter(b => b.health === 'HEALTHY').length;
    const warningBrokers = brokers.filter(b => b.health === 'WARNING').length;
    const criticalBrokers = brokers.filter(b => b.health === 'CRITICAL').length;

    return {
      totalBrokers: brokers.length,
      healthy: healthyBrokers,
      warning: warningBrokers,
      critical: criticalBrokers,
      overallStatus: criticalBrokers > 0 ? 'CRITICAL' : warningBrokers > 0 ? 'WARNING' : 'HEALTHY'
    };
  }

  private generateRecommendations(brokers: any[]): string[] {
    const recommendations: string[] = [];

    for (const broker of brokers) {
      if (broker.metrics.cpuUsage > 80) {
        recommendations.push(`Broker ${broker.brokerId}: High CPU usage (${broker.metrics.cpuUsage.toFixed(1)}%) - consider load balancing`);
      }
      if (broker.metrics.memoryUsage > 85) {
        recommendations.push(`Broker ${broker.brokerId}: High memory usage (${broker.metrics.memoryUsage.toFixed(1)}%) - consider increasing heap size`);
      }
      if (broker.metrics.errorRate > 3) {
        recommendations.push(`Broker ${broker.brokerId}: High error rate (${broker.metrics.errorRate.toFixed(1)}%) - investigate logs`);
      }
    }

    return recommendations;
  }
}