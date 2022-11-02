import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { Not, Repository } from 'typeorm';
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
import { ChangeRoleDto } from './dtos/change-role.dto';
import { LeaveChannelDto } from './dtos/leave-channel.dto';
import { DeclineInvitationDto } from './dtos/decline-invitation.dto';
import { RestrictionDto } from './dtos/restriction.dto';
import { GetChannelsListDto } from './dtos/get-channels-list.dto';
import { GetChannelMessagesDto } from './dtos/get-channel-messages.dto';
import { SaveMessageDto } from './dtos/save-message.dto';

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
      return { id: channel.id, name: channel.name, type: channel.type };
    } catch (err) {
      return err;
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
      return err;
    }
  }

  async joinChannel(joinChannelDto: JoinChannelDto, userId: number) {
    try {
      const channel = await this.getChannelById(joinChannelDto.id);
      const user: UserEntity = await this._userService.getUserById(userId);
      let member: ChannelMemberEntity;
      if (
        await this._channelMemberRepository.findOne({
          where: { user: { id: userId }, channel: { id: joinChannelDto.id } },
        })
      )
        throw new BadRequestException('You are already channel member');
      if (channel.type === ChannelType.PUBLIC) {
        member = this._channelMemberRepository.create({
          channel,
          user,
        });
      } else if (channel.type === ChannelType.PROTECTED) {
        if (bcrypt.compareSync(joinChannelDto.password, channel.password)) {
          member = this._channelMemberRepository.create({
            channel,
            user,
          });
        } else throw new BadRequestException('Wrong password');
      } else if (channel.type === ChannelType.PRIVATE) {
        const invitation = await this._channelInvitationRepository.findOne({
          where: { target: { id: userId }, channel: { id: joinChannelDto.id } },
        });
        if (invitation === null)
          throw new BadRequestException('You have not been invited');
        await this._channelInvitationRepository.remove(invitation);
        member = this._channelMemberRepository.create({
          channel,
          user,
        });
      }
      member = await this._channelMemberRepository.save(member);
      return {
        id: member.id,
        name: member.channel.name,
        type: member.channel.type,
      };
    } catch (err) {
      return err;
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
      return err;
    }
  }

  async declineInvitation(
    declineInvitationDto: DeclineInvitationDto,
    userId: number,
  ) {
    try {
      const invitation = await this._channelInvitationRepository.findOneBy({
        channel: { id: declineInvitationDto.id },
        target: { id: userId },
      });
      if (invitation === null)
        throw new BadRequestException(
          'You have not received an invitation from this channel',
        );
      return await this._channelInvitationRepository.remove(invitation);
    } catch (err) {
      return err;
    }
  }

  async giveAdminRole(giveAdminRole: ChangeRoleDto, userId: number) {
    try {
      const owner = await this._channelMemberRepository.findOneBy({
        channel: { id: giveAdminRole.id },
        user: { id: userId },
      });
      if (owner === null || owner.role !== ChannelRole.OWNER)
        throw new BadRequestException(
          'You are not the owner of the given channel',
        );
      const user = await this._channelMemberRepository.findOneBy({
        channel: { id: giveAdminRole.id },
        user: { nickname: giveAdminRole.username },
      });
      if (user === null)
        throw new BadRequestException('Channel member not found');
      if (user.role === ChannelRole.OWNER || user.role === ChannelRole.ADMIN)
        throw new BadRequestException("Can't give admin role");
      user.role = ChannelRole.ADMIN;
      return await this._channelMemberRepository.save(user);
    } catch (err) {
      return err;
    }
  }

  async takeAdminRole(takeAdminRole: ChangeRoleDto, userId: number) {
    try {
      const owner = await this._channelMemberRepository.findOneBy({
        channel: { id: takeAdminRole.id },
        user: { id: userId },
      });
      if (owner === null || owner.role !== ChannelRole.OWNER)
        throw new BadRequestException(
          'You are not the owner of the given channel',
        );
      const user = await this._channelMemberRepository.findOneBy({
        channel: { id: takeAdminRole.id },
        user: { nickname: takeAdminRole.username },
      });
      if (user === null)
        throw new BadRequestException('Channel member not found');
      if (user.role === ChannelRole.OWNER || user.role === ChannelRole.MEMBER)
        throw new BadRequestException("Can't take admin role");
      user.role = ChannelRole.MEMBER;
      return await this._channelMemberRepository.save(user);
    } catch (err) {
      return err;
    }
  }

  async leaveChannel(leaveChannelDto: LeaveChannelDto, userId: number) {
    try {
      const member = await this._channelMemberRepository.findOneBy({
        channel: { id: leaveChannelDto.id },
        user: { id: userId },
      });
      if (member === null)
        throw new BadRequestException('Channel member not found');
      if (member.role === ChannelRole.OWNER) {
        const admin = await this._channelMemberRepository.findOneBy({
          channel: { id: leaveChannelDto.id },
          role: ChannelRole.ADMIN,
        });
        if (admin) {
          admin.role = ChannelRole.OWNER;
          this._channelMemberRepository.save(admin);
        } else {
          const user = await this._channelMemberRepository.findOneBy({
            channel: { id: leaveChannelDto.id },
            role: ChannelRole.MEMBER,
          });
          if (user) {
            user.role = ChannelRole.OWNER;
            this._channelMemberRepository.save(user);
          } else {
            this.deleteChannel(member.channel.id, userId);
          }
        }
      }
      return await this._channelMemberRepository.remove(member);
    } catch (err) {
      return err;
    }
  }

  async deleteChannel(channelId: number, userId: number) {
    try {
      const owner = await this._channelMemberRepository.findOneBy({
        channel: { id: channelId },
        user: { id: userId },
        role: ChannelRole.OWNER,
      });
      if (owner === null)
        throw new BadRequestException(
          'You are not the owner of the given channel',
        );
      return await this._channelRepository.remove(owner.channel);
    } catch (err) {
      return err;
    }
  }

  async getUserChannels(userId: number) {
    try {
      return await this._channelMemberRepository
        .createQueryBuilder('member')
        .leftJoinAndSelect('member.channel', 'channel')
        .leftJoinAndSelect('member.user', 'user')
        .select(['channel.id', 'channel.name', 'channel.type'])
        .where('user.id = :id', { id: userId })
        .execute();
    } catch (err) {
      return err;
    }
  }

  async ban(restrictionDto: RestrictionDto, userId: number) {
    try {
      const restriction = await this._channelRestrictionsRepository.findOneBy({
        channel: { id: restrictionDto.id },
        user: { nickname: restrictionDto.username },
      });
      const admin = await this._channelMemberRepository.findOneBy({
        channel: { id: restrictionDto.id },
        user: { id: userId },
      });
      if (admin === null || admin.role === ChannelRole.MEMBER)
        throw new BadRequestException(
          'You have no rights to ban someone on this channel',
        );
      const target = await this._channelMemberRepository.findOneBy({
        channel: { id: restrictionDto.id },
        user: { nickname: restrictionDto.username },
        role: ChannelRole.MEMBER,
      });
      if (target === null)
        throw new BadRequestException(
          `${restrictionDto.username} is not part of this channel or has admin rights`,
        );
      const date = new Date();
      date.setMinutes(date.getMinutes() + restrictionDto.minutes);
      if (restriction) {
        restriction.mute = null;
        restriction.ban = date;
        return await this._channelRestrictionsRepository.save(restriction);
      }
      const ban = this._channelRestrictionsRepository.create({
        channel: admin.channel,
        user: target.user,
        ban: date,
      });
      return await this._channelRestrictionsRepository.save(ban);
    } catch (err) {
      return err;
    }
  }

  async mute(restrictionDto: RestrictionDto, userId: number) {
    try {
      const restriction = await this._channelRestrictionsRepository.findOneBy({
        channel: { id: restrictionDto.id },
        user: { nickname: restrictionDto.username },
      });
      const admin = await this._channelMemberRepository.findOneBy({
        channel: { id: restrictionDto.id },
        user: { id: userId },
      });
      if (admin === null || admin.role === ChannelRole.MEMBER)
        throw new BadRequestException(
          'You have no rights to mute someone on this channel',
        );
      const target = await this._channelMemberRepository.findOneBy({
        channel: { id: restrictionDto.id },
        user: { nickname: restrictionDto.username },
        role: ChannelRole.MEMBER,
      });
      if (target === null)
        throw new BadRequestException(
          `${restrictionDto.username} is not part of this channel or has admin rights`,
        );
      const date = new Date();
      date.setMinutes(date.getMinutes() + restrictionDto.minutes);
      if (restriction && restriction.ban)
        throw new BadRequestException(
          'The user is already banned on this channel',
        );
      else if (restriction) {
        restriction.mute = date;
        return await this._channelRestrictionsRepository.save(restriction);
      }
      const mute = this._channelRestrictionsRepository.create({
        channel: admin.channel,
        user: target.user,
        mute: date,
      });
      return await this._channelRestrictionsRepository.save(mute);
    } catch (err) {
      return err;
    }
  }

  async getChannelsList(
    getChannelsListDto: GetChannelsListDto,
    userId: number,
  ) {
    try {
      return await this._channelRepository.find({
        where: {
          members: { user: { id: Not(userId) } },
          type: Not(ChannelType.PRIVATE),
        },
        order: { id: 'ASC' },
        take: 5 + getChannelsListDto.skip,
        skip: getChannelsListDto.skip,
      });
    } catch (err) {
      return err;
    }
  }

  async getChannelMessages(getChannelMessagesDto: GetChannelMessagesDto) {
    try {
      return await this._channelMessageRepository.find({
        where: {
          channel: { id: getChannelMessagesDto.id },
        },
        order: { createdAt: 'DESC' },
        take: 20 + getChannelMessagesDto.skip,
        skip: getChannelMessagesDto.skip,
      });
    } catch (err) {
      return err;
    }
  }

  async saveMessage(saveMessageDto: SaveMessageDto, userId: number) {
    try {
      const channel = await this._channelRepository.findOneBy({
        id: saveMessageDto.id,
      });
      if (channel === null) throw new BadRequestException('Channel not found');
      const member = await this._channelMemberRepository.findOneBy({
        channel,
        user: { id: userId },
      });
      if (member === null)
        throw new BadRequestException('Channel member not found');
      const message = this._channelMessageRepository.create({
        channel: channel,
        sender: member,
        content: saveMessageDto.content,
      });
      return await this._channelMessageRepository.save(message);
    } catch (err) {
      return err;
    }
  }
}
