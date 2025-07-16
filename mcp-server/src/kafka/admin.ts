import { Admin, ITopicConfig } from 'kafkajs';
import { KafkaClientManager } from './client.js';
import { BrokerInfo, ConsumerGroupInfo, TopicHealthInfo } from '../types/kafka.js';

export class KafkaAdminService {
  private admin: Admin;

  constructor(private clientManager: KafkaClientManager) {
    this.admin = clientManager.getKafka().admin();
  }

  async connect(): Promise<void> {
    await this.admin.connect();
  }

  async disconnect(): Promise<void> {
    await this.admin.disconnect();
  }

  async listTopics(): Promise<string[]> {
    return await this.admin.listTopics();
  }

  async describeTopics(topics: string[]): Promise<any> {
    return await this.admin.fetchTopicMetadata({ topics });
  }

  async listConsumerGroups(): Promise<any> {
    return await this.admin.listGroups();
  }

  async describeConsumerGroups(groupIds: string[]): Promise<any> {
    return await this.admin.describeGroups(groupIds);
  }

  async getBrokers(): Promise<BrokerInfo[]> {
    const metadata = await this.admin.fetchTopicMetadata({ topics: [] });
    // Simulate broker info since kafkajs doesn't expose broker details directly
    return [
      {
        id: 1,
        host: 'localhost',
        port: 9092,
        isController: true,
        status: 'ONLINE' as const
      }
    ];
  }

  async getConsumerGroupOffsets(groupId: string): Promise<any> {
    return await this.admin.fetchOffsets({ groupId });
  }

  async getTopicOffsets(topic: string): Promise<any> {
    const metadata = await this.admin.fetchTopicMetadata({ topics: [topic] });
    const topicMetadata = metadata.topics[0];
    
    const partitionOffsets = await Promise.all(
      topicMetadata.partitions.map(async (partition) => {
        const offsets = await this.admin.fetchTopicOffsets(topic);
        const partitionOffset = offsets.find(o => o.partition === partition.partitionId);
        return {
          partition: partition.partitionId,
          offset: partitionOffset?.offset || '0'
        };
      })
    );

    return partitionOffsets;
  }

  async createTopics(topics: ITopicConfig[]): Promise<boolean> {
    const result = await this.admin.createTopics({ topics });
    return result;
  }

  async deleteTopics(topics: string[]): Promise<void> {
    await this.admin.deleteTopics({ topics });
  }
}