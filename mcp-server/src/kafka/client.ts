import { Kafka, KafkaConfig as KafkaJSConfig } from 'kafkajs';
import { KafkaConfig } from '../types/kafka.js';

export class KafkaClientManager {
  private kafka: Kafka;
  private config: KafkaConfig;

  constructor(config: KafkaConfig) {
    this.config = config;
    
    const kafkaConfig: KafkaJSConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
    };

    if (config.ssl) {
      kafkaConfig.ssl = true;
    }

    if (config.sasl) {
      kafkaConfig.sasl = {
        mechanism: config.sasl.mechanism as any,
        username: config.sasl.username,
        password: config.sasl.password,
      };
    }

    this.kafka = new Kafka(kafkaConfig);
  }

  getKafka(): Kafka {
    return this.kafka;
  }

  getConfig(): KafkaConfig {
    return this.config;
  }
}