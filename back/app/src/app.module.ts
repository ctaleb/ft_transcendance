import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication.module';

@Module({
  imports: [
    UsersModule,
    AuthenticationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'front/app/dist'),
    }),
    DatabaseModule,
  ],
})
export class AppModule {}
