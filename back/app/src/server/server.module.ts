import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from 'src/chat/chat.module';
import { FriendshipModule } from 'src/friendship/friendship.module';
import { FriendshipService } from 'src/friendship/friendship.service';
import { PrivateMessageEntity } from 'src/private_conv/entities/privateMessage.entity';
import { PrivateConvEntity } from 'src/private_conv/entities/private_conv.entity';
import { PrivateConvModule } from 'src/private_conv/private_conv.module';
import { PrivateConvService } from 'src/private_conv/private_conv.service';
import { ProfileController } from 'src/server/profile.controller';
import { UserModule } from 'src/user/user.module';
import { MatchHistoryEntity } from './entities/match_history.entity';
import { ServerGateway } from './server.gateway';
import { ServerService } from './server.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchHistoryEntity, PrivateMessageEntity, PrivateConvEntity]),
    UserModule,
    ChatModule,
    PrivateConvModule,
    FriendshipModule,
  ],
  controllers: [ProfileController],
  providers: [ServerGateway, ServerService, PrivateConvService, FriendshipService],
  exports: [ServerService],
})
export class ServerModule {}
