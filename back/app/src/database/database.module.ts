import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { database } from '../config/config.js';
import { AuthenticationSubscriber } from 'src/authentication/authentication.subscriber';
import { ChannelSubscriber } from 'src/chat/channel.subscriber';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: database.host,
      port: database.port,
      username: database.username,
      password: database.password,
      database: database.name,
      entities: [__dirname + '/../**/*.entity.js'],
      synchronize: true,
      subscribers: [AuthenticationSubscriber, ChannelSubscriber],
    }),
  ],
})
export class DatabaseModule {}
