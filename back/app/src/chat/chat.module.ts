import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel_member.entity';
import { ChannelMessageEntity } from './entities/channel_message.entity';
import { ChannelRestrictionsEntity } from './entities/channel_restrictions.entity';
import { ChannelInvitationEntity } from './entities/channel_invitation.entity';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { ServerModule } from 'src/server/server.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelEntity, ChannelMemberEntity, ChannelMessageEntity, ChannelRestrictionsEntity, ChannelInvitationEntity]),
    UserModule,
    PassportModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
