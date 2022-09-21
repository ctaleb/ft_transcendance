import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsersModule } from './user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ImageModule } from './image/image.module';
import { ServerModule } from './server/server.module';
import { FriendListModule } from './friend_list/friend_list.module';
import { OauthModule } from './oauth/oauth.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ImageModule,
    ServerModule,
    AuthenticationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'front/app/dist'),
    }),
    FriendListModule,
    OauthModule,
  ],
})
export class AppModule {}
