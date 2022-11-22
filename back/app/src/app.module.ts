import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ImageModule } from './image/image.module';
import { ServerModule } from './server/server.module';
import { OauthModule } from './oauth/oauth.module';
import { FriendshipModule } from './friendship/friendship.module';
import { ChatModule } from './chat/chat.module';
import { PrivateConvModule } from './private_conv/private_conv.module';
import { twofactorModule } from './twoFactorAuth/twoFactorAuth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      isGlobal: true,
    }),
    UserModule,
    DatabaseModule,
    ImageModule,
    ServerModule,
    AuthenticationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'front/app/dist'),
    }),
    OauthModule,
    FriendshipModule,
    ChatModule,
    PrivateConvModule,
    twofactorModule,
  ],
})
export class AppModule {}
