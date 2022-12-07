import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { database } from '../config/config.js';
import { AuthenticationSubscriber } from 'src/authentication/authentication.subscriber';
import { ChannelSubscriber } from 'src/chat/channel.subscriber';
require('dotenv').config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [__dirname + '/../**/*.entity.js'],
      synchronize: true,
      subscribers: [AuthenticationSubscriber, ChannelSubscriber],
    }),
  ],
})
export class DatabaseModule {}
