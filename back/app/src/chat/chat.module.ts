import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelInvitationEntity } from './entities/channel_invitation.entity';
import { ChannelMemberEntity } from './entities/channel_member.entity';
import { ChannelMessageEntity } from './entities/channel_message.entity';
import { ChannelRestrictionsEntity } from './entities/channel_restrictions.entity';

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
