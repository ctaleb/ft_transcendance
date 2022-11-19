import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { Entity, LessThan, Not, Repository } from 'typeorm';
import { ChangeRoleDto } from './dtos/change-role.dto';
import { CreateChannelDto } from './dtos/create-channel.dto';
import { DeclineInvitationDto } from './dtos/decline-invitation.dto';
import { GetChannelMessagesDto } from './dtos/get-channel-messages.dto';
import { GetChannelsListDto } from './dtos/get-channels-list.dto';
import { InviteToChannelDto } from './dtos/invite-to-channel.dto';
import { JoinChannelDto } from './dtos/join-channel.dto';
import { LeaveChannelDto } from './dtos/leave-channel.dto';
import { RestrictionDto } from './dtos/restriction.dto';
import { SaveMessageDto } from './dtos/save-message.dto';
import { UpdateChannelDto } from './dtos/update-channel.dto';
import { ChannelEntity, ChannelType } from './entities/channel.entity';
import { ChannelInvitationEntity } from './entities/channel_invitation.entity';
import {
  ChannelMemberEntity,
  ChannelRole,
} from './entities/channel_member.entity';
import { ChannelMessageEntity } from './entities/channel_message.entity';
import { ChannelRestrictionsEntity } from './entities/channel_restrictions.entity';

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
    const user: UserEntity = await this._userService.getUserByNickname(
      nickname,
    );
    let channel: ChannelEntity = this._channelRepository.create({
      name: channelDto.name,
      type: channelDto.type,
      password:
        channelDto.type === ChannelType.PROTECTED ? channelDto.password : null,
    });
    channel = await this._channelRepository.save(channel);
    let owner = this._channelMemberRepository.create({
      channel,
      user,
      role: ChannelRole.OWNER,
    });
    owner = await this._channelMemberRepository.save(owner);
    return { id: channel.id, name: channel.name, type: channel.type };
  }

  async updateChannel(updateChannelDto: UpdateChannelDto, userId: number) {
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
  }

  async joinChannel(joinChannelDto: JoinChannelDto, userId: number) {
    const channel = await this.getChannelById(joinChannelDto.id);
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
        user: { id: userId },
      });
    } else if (channel.type === ChannelType.PROTECTED) {
      if (bcrypt.compareSync(joinChannelDto.password, channel.password)) {
        member = this._channelMemberRepository.create({
          channel,
          user: { id: userId },
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
        user: { id: userId },
      });
    }
    member = await this._channelMemberRepository.save(member);
    return {
      id: member.channel.id,
      name: member.channel.name,
      type: member.channel.type,
    };
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
  ): Promise<ChannelInvitationEntity> {
    const member = await this._channelMemberRepository.findOneBy({
      user: { id: userId },
      channel: { id: inviteToChannelDto.channelId },
    });
    if (member === null) {
      throw new BadRequestException('You are not member of the given channel');
    } else if (member.channel.type !== ChannelType.PRIVATE) {
      throw new BadRequestException(
        'This channel does not support invitation feature',
      );
    }
    const invitationTarget = await this._userService.getUserByNickname(
      inviteToChannelDto.username,
    );
    if (
      (await this._channelInvitationRepository.findOneBy({
        channel: { id: inviteToChannelDto.channelId },
        target: { id: invitationTarget.id },
      })) !== null
    ) {
      throw new BadRequestException('This user has already been invited');
    }
    if (
      (await this._channelMemberRepository.findOneBy({
        user: { id: invitationTarget.id },
        channel: { id: inviteToChannelDto.channelId },
      })) !== null
    ) {
      throw new BadRequestException('This user is already a channel member');
    }
    const invitation = this._channelInvitationRepository.create({
      channel: { id: inviteToChannelDto.channelId },
      target: invitationTarget,
    });
    return await this._channelInvitationRepository.save(invitation);
  }

  async declineInvitation(
    declineInvitationDto: DeclineInvitationDto,
    userId: number,
  ) {
    const invitation = await this._channelInvitationRepository.findOneBy({
      channel: { id: declineInvitationDto.id },
      target: { id: userId },
    });
    if (invitation === null)
      throw new BadRequestException(
        'You have not received an invitation from this channel',
      );
    return await this._channelInvitationRepository.remove(invitation);
  }

  async giveAdminRole(giveAdminRole: ChangeRoleDto, userId: number) {
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
  }

  async takeAdminRole(takeAdminRole: ChangeRoleDto, userId: number) {
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
  }

  async leaveChannel(leaveChannelDto: LeaveChannelDto, userId: number) {
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
        await this._channelMemberRepository.save(admin);
      } else {
        const user = await this._channelMemberRepository.findOneBy({
          channel: { id: leaveChannelDto.id },
          role: ChannelRole.MEMBER,
        });
        if (user) {
          user.role = ChannelRole.OWNER;
          await this._channelMemberRepository.save(user);
        } else {
          await this.deleteChannel(member.channel.id, userId);
        }
      }
    }
    return {
      id: (await this._channelMemberRepository.remove(member)).channel.id,
    };
  }

  async deleteChannel(channelId: number, userId: number) {
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
  }

  async getUserChannels(userId: number) {
    return await this._channelMemberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.channel', 'channel')
      .leftJoinAndSelect('member.user', 'user')
      .select([
        'channel.id AS id',
        'channel.name AS name',
        'channel.type AS type',
      ])
      .where('user.id = :id', { id: userId })
      .execute();
  }

  async ban(restrictionDto: RestrictionDto, userId: number) {
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
  }

  async mute(restrictionDto: RestrictionDto, userId: number) {
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
  }

  async getChannelsList(
    getChannelsListDto: GetChannelsListDto,
    userId: number,
  ) {
    const userChannels: { id: number; name: string; type: string }[] =
      await this.getUserChannels(userId);
    const result: { id: number; name: string; type: string }[] = [];
    if (getChannelsListDto.skip === 0) {
      await this._channelInvitationRepository
        .findBy({
          target: { id: userId },
        })
        .then((data) => {
          data.forEach((elem) => {
            result.push({
              id: elem.channel.id,
              name: elem.channel.name,
              type: elem.channel.type,
            });
          });
        });
    }
    await this._channelRepository
      .find({
        where: {
          type: Not(ChannelType.PRIVATE),
        },
        order: { id: 'ASC' },
        take: 20,
        skip: getChannelsListDto.skip,
      })
      .then((data) => {
        data = data.filter(
          (elem) => !userChannels.find((userChan) => userChan.id === elem.id),
        );
        data.forEach((elem) => {
          result.push({ id: elem.id, name: elem.name, type: elem.type });
        });
      });

    return result;
  }

  async getChannelMembers(
    getChannelMembersDto: LeaveChannelDto,
    userId: number,
  ) {
    const query = this._channelMemberRepository
      .createQueryBuilder('member')
      .select('member.channelId')
      .where('member.userId = :id', { id: userId })
      .andWhere('member.channelId = :chanId', {
        chanId: getChannelMembersDto.id,
      });
    const channel = await this._channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.members', 'members')
      .innerJoin('members.user', 'user')
      .innerJoin('user.avatar', 'avatar')
      .select([
        'user.nickname AS nickname',
        'avatar.path AS path',
        'members.role AS role',
      ])
      .where('channel.id IN (' + query.getQuery() + ')')
      .setParameters(query.getParameters())
      .orderBy('members.role', 'ASC')
      .execute();
    return channel;
  }

  async getChannelMessages(getChannelMessagesDto: GetChannelMessagesDto) {
    const result: { author: string; text: string; date: Date }[] = [];
    await this._channelMessageRepository
      .find({
        relations: {
          channel: true,
          sender: true,
        },
        where: { channel: { id: getChannelMessagesDto.id } },
        order: { createdAt: 'DESC' },
        skip: getChannelMessagesDto.skip,
        take: 20,
      })
      .then((data) => {
        data.forEach((entry) => {
          result.unshift({
            author: entry.sender ? entry.sender.user.nickname : 'UNKNOWN',
            text: entry.content,
            date: entry.createdAt,
          });
        });
      });
    return result;
  }

  async loadChannel(loadChannelDto: LeaveChannelDto, userId: number) {
    const channel = await this.getChannelById(loadChannelDto.id);
    if (
      (await this._channelMemberRepository.findOneBy({
        channel: { id: channel.id },
        user: { id: userId },
      })) === null
    )
      throw new BadRequestException('You are not a channel member');
    const ban = await this._channelRestrictionsRepository.findOneBy({
      channel: { id: channel.id },
      user: { id: userId },
    });
    if (ban) {
      if (ban.ban.getTime() < Date.now())
        await this._channelRestrictionsRepository.remove(ban);
      else throw new BadRequestException(`You are banned till ${ban.ban}`);
    }
    const members: { nickname: string; path: string; role: ChannelRole }[] = [];
    await this._channelMemberRepository
      .find({
        where: { channel: { id: channel.id } },
        order: { role: 'ASC' },
      })
      .then((data) => {
        data.forEach((entry) => {
          members.push({
            nickname: entry.user.nickname,
            path: entry.user.avatar.path,
            role: entry.role,
          });
        });
      });
    const messages = await this.getChannelMessages({
      id: channel.id,
      skip: 0,
    });
    return {
      members: members,
      messages: messages,
    };
  }

  async saveMessage(saveMessageDto: SaveMessageDto, userId: number) {
    const channel = await this._channelRepository.findOneBy({
      id: saveMessageDto.id,
    });
    if (channel === null) throw new BadRequestException('Channel not found');
    const mute = await this._channelRestrictionsRepository.findOneBy({
      channel: { id: channel.id },
      user: { id: userId },
      mute: LessThan(new Date()),
    });
    if (mute) throw new BadRequestException(`You are muted till ${mute.mute}`);
    const member = await this._channelMemberRepository.findOneBy({
      channel: { id: saveMessageDto.id },
      user: { id: userId },
    });
    if (member === null)
      throw new BadRequestException('Channel member not found');
    let message = this._channelMessageRepository.create({
      channel: { id: channel.id },
      sender: { id: member.id },
      content: saveMessageDto.content,
    });
    message = await this._channelMessageRepository.save(message);
    return {
      author: member.user.nickname,
      text: message.content,
      date: message.createdAt,
    };
  }
}
