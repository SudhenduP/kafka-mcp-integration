export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  ssl?: boolean;
  sasl?: {
    mechanism: string;
    username: string;
    password: string;
  };
}

export interface ConsumerLagInfo {
  topic: string;
  partition: number;
  currentOffset: number;
  logEndOffset: number;
  lag: number;
  consumerId?: string;
}

export interface ConsumerGroupInfo {
  groupId: string;
  state: string;
  members: ConsumerMemberInfo[];
  totalLag: number;
  partitionLags: ConsumerLagInfo[];
}

export interface ConsumerMemberInfo {
  memberId: string;
  clientId: string;
  clientHost: string;
  assignment: {
    topic: string;
    partitions: number[];
  }[];
}

export interface TopicHealthInfo {
  topic: string;
  partitions: number;
  replicationFactor: number;
  messageRate: number;
  bytesRate: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: string[];
}

export interface BrokerInfo {
  id: number;
  host: string;
  port: number;
  rack?: string;
  isController: boolean;
  status: 'ONLINE' | 'OFFLINE';
}

export interface MessageSample {
  partition: number;
  offset: number;
  key?: string;
  value: any;
  timestamp: Date;
  headers?: Record<string, string>;
}