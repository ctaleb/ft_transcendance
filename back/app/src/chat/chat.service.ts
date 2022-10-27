import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { Channel } from '../server/entities/channel';
import { ChannelDto } from './dtos/channel.dto';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelInvitationEntity } from './entities/channel_invitation.entity';
import {
  ChannelMemberEntity,
  ChannelRole,
} from './entities/channel_member.entity';
import { ChannelMessageEntity } from './entities/channel_message.entity';
import { ChannelRestrictionsEntity } from './entities/channel_restrictions.entity';
import { ChannelType } from './entities/channel.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChannelEntity)
    private _channelRepository: Repository<ChannelEntity>,
    @InjectRepository(ChannelMemberEntity)
    private _channelMemberRepository: Repository<ChannelMemberEntity>,
    @InjectRepository(ChannelMessageEntity)
    private _channelMessageRepository: Repository<ChannelMessageEntity>,
    @InjectRepository(ChannelRestrictionsEntity)
    private _channelRestrictionsRepository: Repository<ChannelRestrictionsEntity>,
    @InjectRepository(ChannelInvitationEntity)
    private _channelInvitationRepository: Repository<ChannelInvitationEntity>,
    private _userService: UserService,
  ) {}

  async createChannel(channelDto: ChannelDto, nickname: string) {
    try {
      const user: UserEntity = await this._userService.getUserByNickname(
        nickname,
      );
      let type: ChannelType;
      if (channelDto.type === 'protected') type = ChannelType.PROTECTED;
      else if (channelDto.type === 'private') type = ChannelType.PRIVATE;
      else type = ChannelType.PUBLIC;
      let channel: ChannelEntity = this._channelRepository.create({
        name: channelDto.name,
        type: type,
        password: channelDto.password,
      });
      channel = await this._channelRepository.save(channel);
      let owner = this._channelMemberRepository.create({
        channel,
        user,
        role: ChannelRole.OWNER,
      });
      owner = await this._channelMemberRepository.save(owner);
      return channel;
    } catch (err) {
      console.log(err);
    }
  }

  async changeChannelPassword(channel: ChannelDto, nickname: string) {
    try {
    } catch (err) {
      console.log(err);
    }
  }

  async updateChannel() {}

  async giveAdminRole() {}

  async takeAdminRole() {}

  async ban() {}

  async mute() {}

  async joinChannel() {}

  async quitChannel() {}
}
