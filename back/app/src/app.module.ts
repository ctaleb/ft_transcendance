import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsersModule } from './user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ImageModule } from './image/image.module';
import { MessagesModule } from './server/server.module';
import { FriendListModule } from './friend_list/friend_list.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ImageModule,
    MessagesModule,
    AuthenticationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'front/app/dist'),
    }),
    FriendListModule,
  ],
})
export class AppModule {}
