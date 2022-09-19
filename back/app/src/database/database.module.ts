import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { database } from '../config/config.js';
import { AuthenticationSubscriber } from 'src/authentication/authentication.subscriber';

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
      synchronize: false,
      subscribers: [AuthenticationSubscriber],
    }),
  ],
})
export class DatabaseModule {}
