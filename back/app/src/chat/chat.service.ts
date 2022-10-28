import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { CreateChannelDto } from './dtos/create-channel.dto';
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
import { UpdateChannelDto } from './dtos/update-channel.dto';
import { JoinChannelDto } from './dtos/join-channel.dto';
import * as bcrypt from 'bcrypt';
import { InviteToChannelDto } from './dtos/invite-to-channel.dto';

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

  async createChannel(channelDto: CreateChannelDto, nickname: string) {
    try {
      const user: UserEntity = await this._userService.getUserByNickname(
        nickname,
      );
      let channel: ChannelEntity = this._channelRepository.create({
        name: channelDto.name,
        type: channelDto.type,
        password:
          channelDto.type === ChannelType.PROTECTED
            ? channelDto.password
            : null,
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

  async updateChannel(updateChannelDto: UpdateChannelDto, userId: number) {
    try {
      const owner = await this._channelMemberRepository.findOne({
        where: { user: { id: userId } },
      });
      if (owner.channel.id !== updateChannelDto.id)
        throw new BadRequestException('You are not the channel owner');
      owner.channel.password =
        updateChannelDto.type === ChannelType.PROTECTED
          ? updateChannelDto.password
          : null;
      owner.channel.type = updateChannelDto.type;
      return await this._channelRepository.save(owner.channel);
    } catch (err) {
      console.log(err);
    }
  }

  async joinChannel(joinChannelDto: JoinChannelDto, userId: number) {
    try {
      const channel = await this.getChannelById(joinChannelDto.id);
      const user: UserEntity = await this._userService.getUserById(userId);
      if (
        await this._channelMemberRepository.findOne({
          where: { user: { id: userId }, channel: { id: joinChannelDto.id } },
        })
      )
        throw new BadRequestException('You are already channel member');
      if (channel.type === ChannelType.PUBLIC) {
        const member = this._channelMemberRepository.create({
          channel,
          user,
        });
        return await this._channelMemberRepository.save(member);
      } else if (channel.type === ChannelType.PROTECTED) {
        if (bcrypt.compareSync(joinChannelDto.password, channel.password)) {
          const member = this._channelMemberRepository.create({
            channel,
            user,
          });
          return await this._channelMemberRepository.save(member);
        } else throw new BadRequestException('Wrong password');
      } else if (channel.type === ChannelType.PRIVATE) {
        const invitation = await this._channelInvitationRepository.findOne({
          where: { target: { id: userId }, channel: { id: joinChannelDto.id } },
        });
        if (invitation === null)
          throw new BadRequestException('You have not been invited');
        else {
          await this._channelInvitationRepository.remove(invitation);
          const member = this._channelMemberRepository.create({
            channel,
            user,
          });
          return await this._channelMemberRepository.save(member);
        }
      }
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getChannelById(id: number) {
    const channel = await this._channelRepository.findOneBy({
      id,
    });
    if (channel === null) throw new BadRequestException('Channel not found');
    return channel;
  }

  async inviteToChannel(
    inviteToChannelDto: InviteToChannelDto,
    userId: number,
  ) {
    try {
      const channel = await this.getChannelById(inviteToChannelDto.channelId);
      if (channel.type !== ChannelType.PRIVATE)
        throw new BadRequestException(
          'This channel does not support invitation feature',
        );
      if (
        (await this._channelMemberRepository.findOne({
          where: {
            user: { id: userId },
            channel: { id: inviteToChannelDto.channelId },
          },
        })) === null
      )
        throw new BadRequestException(
          'You cannot invite someone to this channel',
        );
      const user = await this._userService.getUserByNickname(
        inviteToChannelDto.username,
      );
      if (
        (await this._channelMemberRepository.findOne({
          where: {
            user: { id: user.id },
            channel: { id: inviteToChannelDto.channelId },
          },
        })) !== null
      )
        throw new BadRequestException('The user is already in that channel');
      const invitation = this._channelInvitationRepository.create({
        channel,
        target: user,
      });
      return await this._channelInvitationRepository.save(invitation);
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async giveAdminRole() {}

  async takeAdminRole() {}

  async ban() {}

  async mute() {}

  async quitChannel() {}

  async getUserChannels() {}
}
