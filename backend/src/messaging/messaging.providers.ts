import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const messagingProviders = [
  {
    provide: 'RABBITMQ_CLIENT',
    useFactory: () =>
      ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
          queue: 'fleet_audit',
          queueOptions: { durable: true },
        },
      }),
  },
];
