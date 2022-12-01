import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { channel } from 'diagnostics_channel';
import { IChannel } from 'src/chat/chat.types';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { LessThan, Not } from 'typeorm';
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
import { ChannelMemberEntity, ChannelRole } from './entities/channel_member.entity';
import { ChannelMessageEntity } from './entities/channel_message.entity';
import { ChannelRestrictionsEntity } from './entities/channel_restrictions.entity';

@Injectable()
export class ChatService {
  constructor(private _userService: UserService) {}

  async createChannel(channelDto: CreateChannelDto, nickname: string) {
    const user: UserEntity = await this._userService.getUserByNickname(nickname);
    const uniqueCheck = await ChannelEntity.findOneBy({ name: channelDto.name });
    if (uniqueCheck) throw new BadRequestException('Channel with that name already exists');
    let channel: ChannelEntity = ChannelEntity.create({
      name: channelDto.name,
      type: channelDto.type,
      password: channelDto.type === ChannelType.PROTECTED ? channelDto.password : null,
    });
    channel = await ChannelEntity.save(channel);
    let owner = ChannelMemberEntity.create({
      channel,
      user,
      role: ChannelRole.OWNER,
    });
    owner = await ChannelMemberEntity.save(owner);
    return { id: channel.id, name: channel.name, type: channel.type };
  }

  async updateChannel(updateChannelDto: UpdateChannelDto, userId: number) {
    const owner = await ChannelMemberEntity.findOne({
      where: { user: { id: userId }, channel: { id: updateChannelDto.id } },
    });
    if (!owner || owner.channel.id !== updateChannelDto.id) throw new BadRequestException('You are not the channel owner');
    owner.channel.password = updateChannelDto.type === ChannelType.PROTECTED ? updateChannelDto.password : null;
    owner.channel.type = updateChannelDto.type;
    return await ChannelEntity.save(owner.channel);
  }

  async joinChannel(joinChannelDto: JoinChannelDto, userId: number) {
    const channel = await this.getChannelById(joinChannelDto.id);
    let member: ChannelMemberEntity;
    if (
      await ChannelMemberEntity.findOne({
        where: { user: { id: userId }, channel: { id: joinChannelDto.id } },
      })
    )
      throw new BadRequestException('You are already channel member');
    if (channel.type === ChannelType.PUBLIC) {
      member = ChannelMemberEntity.create({
        channel,
        user: { id: userId },
      });
    } else if (channel.type === ChannelType.PROTECTED) {
      if (bcrypt.compareSync(joinChannelDto.password, channel.password)) {
        member = ChannelMemberEntity.create({
          channel,
          user: { id: userId },
        });
      } else throw new BadRequestException('Wrong password');
    } else if (channel.type === ChannelType.PRIVATE) {
      const invitation = await ChannelInvitationEntity.findOne({
        where: { target: { id: userId }, channel: { id: joinChannelDto.id } },
      });
      if (invitation === null) throw new BadRequestException('You have not been invited');
      await ChannelInvitationEntity.remove(invitation);
      member = ChannelMemberEntity.create({
        channel,
        user: { id: userId },
      });
    }
    member = await ChannelMemberEntity.save(member);
    return {
      id: member.channel.id,
      name: member.channel.name,
      type: member.channel.type,
    };
  }

  async getChannelById(id: number) {
    const channel = await ChannelEntity.findOneBy({
      id,
    });
    if (channel === null) throw new BadRequestException('Channel not found');
    return channel;
  }

  async inviteToChannel(inviteToChannelDto: InviteToChannelDto, userId: number) {
    const member = await ChannelMemberEntity.findOneBy({
      user: { id: userId },
      channel: { id: inviteToChannelDto.channelId },
    });
    if (member === null) {
      throw new BadRequestException('You are not member of the given channel');
    } else if (member.channel.type !== ChannelType.PRIVATE) {
      throw new BadRequestException('This channel does not support invitation feature');
    }
    const invitationTarget = await this._userService.getUserByNickname(inviteToChannelDto.username);
    if (
      (await ChannelInvitationEntity.findOneBy({
        channel: { id: inviteToChannelDto.channelId },
        target: { id: invitationTarget.id },
      })) !== null
    ) {
      throw new BadRequestException('This user has already been invited');
    }
    if (
      (await ChannelMemberEntity.findOneBy({
        user: { id: invitationTarget.id },
        channel: { id: inviteToChannelDto.channelId },
      })) !== null
    ) {
      throw new BadRequestException('This user is already a channel member');
    }
    const invitation = ChannelInvitationEntity.create({
      channel: { id: inviteToChannelDto.channelId },
      target: invitationTarget,
    });
    const result = await ChannelInvitationEntity.save(invitation);
    return { channel: member.channel.name, target: result.target.nickname };
  }

  async declineInvitation(declineInvitationDto: DeclineInvitationDto, userId: number) {
    const invitation = await ChannelInvitationEntity.findOneBy({
      channel: { id: declineInvitationDto.id },
      target: { id: userId },
    });
    if (invitation === null) throw new BadRequestException('You have not received an invitation from this channel');
    return await ChannelInvitationEntity.remove(invitation);
  }

  async giveAdminRole(giveAdminRole: ChangeRoleDto, userId: number) {
    const owner = await ChannelMemberEntity.findOneBy({
      channel: { id: giveAdminRole.id },
      user: { id: userId },
    });
    if (owner === null || owner.role !== ChannelRole.OWNER) throw new BadRequestException('You are not the owner of the given channel');
    const user = await ChannelMemberEntity.findOneBy({
      channel: { id: giveAdminRole.id },
      user: { nickname: giveAdminRole.username },
    });
    if (user === null) throw new BadRequestException('Channel member not found');
    if (user.role === ChannelRole.OWNER || user.role === ChannelRole.ADMIN) throw new BadRequestException("Can't give admin role");
    user.role = ChannelRole.ADMIN;
    return await ChannelMemberEntity.save(user);
  }

  async takeAdminRole(takeAdminRole: ChangeRoleDto, userId: number) {
    const owner = await ChannelMemberEntity.findOneBy({
      channel: { id: takeAdminRole.id },
      user: { id: userId },
    });
    if (owner === null || owner.role !== ChannelRole.OWNER) throw new BadRequestException('You are not the owner of the given channel');
    const user = await ChannelMemberEntity.findOneBy({
      channel: { id: takeAdminRole.id },
      user: { nickname: takeAdminRole.username },
    });
    if (user === null) throw new BadRequestException('Channel member not found');
    if (user.role === ChannelRole.OWNER || user.role === ChannelRole.MEMBER) throw new BadRequestException("Can't take admin role");
    user.role = ChannelRole.MEMBER;
    return await ChannelMemberEntity.save(user);
  }

  async leaveChannel(leaveChannelDto: LeaveChannelDto, userId: number) {
    const member = await ChannelMemberEntity.findOneBy({
      channel: { id: leaveChannelDto.id },
      user: { id: userId },
    });
    if (member === null) throw new BadRequestException('Channel member not found');
    if (member.role === ChannelRole.OWNER) {
      const admin = await ChannelMemberEntity.findOneBy({
        channel: { id: leaveChannelDto.id },
        role: ChannelRole.ADMIN,
      });
      if (admin) {
        admin.role = ChannelRole.OWNER;
        await ChannelMemberEntity.save(admin);
      } else {
        const user = await ChannelMemberEntity.findOneBy({
          channel: { id: leaveChannelDto.id },
          role: ChannelRole.MEMBER,
        });
        if (user) {
          user.role = ChannelRole.OWNER;
          await ChannelMemberEntity.save(user);
        } else {
          await this.deleteChannel(member.channel.id, userId);
        }
      }
    }
    return {
      id: (await ChannelMemberEntity.remove(member)).channel.id,
    };
  }

  async deleteChannel(channelId: number, userId: number) {
    const owner = await ChannelMemberEntity.findOneBy({
      channel: { id: channelId },
      user: { id: userId },
      role: ChannelRole.OWNER,
    });
    if (owner === null) throw new BadRequestException('You are not the owner of the given channel');
    return await ChannelEntity.remove(owner.channel);
  }

  async getUserChannels(userId: number): Promise<IChannel[]> {
    return await ChannelMemberEntity.createQueryBuilder('member')
      .leftJoinAndSelect('member.channel', 'channel')
      .leftJoinAndSelect('member.user', 'user')
      .select(['channel.id AS id', 'channel.name AS name', 'channel.type AS type'])
      .where('user.id = :id', { id: userId })
      .execute();
  }

  async ban(restrictionDto: RestrictionDto, userId: number) {
    const restriction = await ChannelRestrictionsEntity.findOneBy({
      channel: { id: restrictionDto.id },
      user: { nickname: restrictionDto.username },
    });
    const admin = await ChannelMemberEntity.findOneBy({
      channel: { id: restrictionDto.id },
      user: { id: userId },
    });
    if (admin === null || admin.role === ChannelRole.MEMBER) throw new BadRequestException('You have no rights to ban someone on this channel');
    const target = await ChannelMemberEntity.findOneBy({
      channel: { id: restrictionDto.id },
      user: { nickname: restrictionDto.username },
      role: ChannelRole.MEMBER,
    });
    if (target === null) throw new BadRequestException(`${restrictionDto.username} is not part of this channel or has admin rights`);
    const date = new Date();
    date.setMinutes(date.getMinutes() + restrictionDto.minutes);
    if (restriction) {
      restriction.mute = null;
      restriction.ban = date;
      return await ChannelRestrictionsEntity.save(restriction);
    }
    const ban = ChannelRestrictionsEntity.create({
      channel: admin.channel,
      user: target.user,
      ban: date,
    });
    return await ChannelRestrictionsEntity.save(ban);
  }

  async mute(restrictionDto: RestrictionDto, userId: number) {
    const restriction = await ChannelRestrictionsEntity.findOneBy({
      channel: { id: restrictionDto.id },
      user: { nickname: restrictionDto.username },
    });
    const admin = await ChannelMemberEntity.findOneBy({
      channel: { id: restrictionDto.id },
      user: { id: userId },
    });
    if (admin === null || admin.role === ChannelRole.MEMBER) throw new BadRequestException('You have no rights to mute someone on this channel');
    const target = await ChannelMemberEntity.findOneBy({
      channel: { id: restrictionDto.id },
      user: { nickname: restrictionDto.username },
      role: ChannelRole.MEMBER,
    });
    if (target === null) throw new BadRequestException(`${restrictionDto.username} is not part of this channel or has admin rights`);
    const date = new Date();
    date.setMinutes(date.getMinutes() + restrictionDto.minutes);
    if (restriction && restriction.ban) throw new BadRequestException('The user is already banned on this channel');
    else if (restriction) {
      restriction.mute = date;
      return await ChannelRestrictionsEntity.save(restriction);
    }
    const mute = ChannelRestrictionsEntity.create({
      channel: admin.channel,
      user: target.user,
      mute: date,
    });
    return await ChannelRestrictionsEntity.save(mute);
  }

  async getChannelInvitations(userId: number): Promise<IChannel[]> {
    const result: IChannel[] = [];

    await ChannelInvitationEntity.findBy({
      target: { id: userId },
    }).then((data) => {
      data.forEach((elem) => {
        result.push({
          id: elem.channel.id,
          name: elem.channel.name,
          type: elem.channel.type,
        });
      });
    });
    return result;
  }

  async getChannelsList(userId: number): Promise<IChannel[]> {
    const userChannels: IChannel[] = await this.getUserChannels(userId);
    const result: IChannel[] = [];

    await ChannelEntity.find({
      where: {
        // @ts-ignore
        type: Not(ChannelType.PRIVATE),
      },
      order: { id: 'ASC' },
    }).then((data) => {
      data = data.filter((elem) => !userChannels.find((userChan) => userChan.id === elem.id));
      data.forEach((elem) => {
        result.push({ id: elem.id, name: elem.name, type: elem.type });
      });
    });
    return result;
  }

  async getChannelMembers(getChannelMembersDto: LeaveChannelDto, userId: number) {
    const member = await ChannelMemberEntity.findBy({
      user: { id: userId },
      channel: { id: getChannelMembersDto.id },
    });
    if (!member) throw new BadRequestException('You are not a channel member');
    const members: { id: number; nickname: string; avatar: string; role: ChannelRole }[] = [];
    await ChannelMemberEntity.find({
      where: { channel: { id: getChannelMembersDto.id } },
      order: { role: 'ASC' },
    }).then((data) => {
      data.forEach((entry) => {
        members.push({
          id: entry.user.id,
          nickname: entry.user.nickname,
          avatar: entry.user.getAvatarUrl(),
          role: entry.role,
        });
      });
    });
    return members;
  }

  async getChannelMessages(getChannelMessagesDto: GetChannelMessagesDto) {
    const result: { author: string; text: string; date: Date }[] = [];
    await ChannelMessageEntity.find({
      relations: {
        channel: true,
        sender: true,
      },
      where: { channel: { id: getChannelMessagesDto.id } },
      order: { createdAt: 'DESC' },
      skip: getChannelMessagesDto.skip,
      take: 20,
    }).then((data) => {
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
      (await ChannelMemberEntity.findOneBy({
        channel: { id: channel.id },
        user: { id: userId },
      })) === null
    )
      throw new BadRequestException('You are not a channel member');
    const ban = await ChannelRestrictionsEntity.findOneBy({
      channel: { id: channel.id },
      user: { id: userId },
    });
    if (ban) {
      if (ban.ban.getTime() < Date.now()) await ChannelRestrictionsEntity.remove(ban);
      else throw new BadRequestException(`You are banned till ${ban.ban}`);
    }
    const members: { id: number; nickname: string; avatar: string; role: ChannelRole }[] = [];
    await ChannelMemberEntity.find({
      where: { channel: { id: channel.id } },
      order: { role: 'ASC' },
    }).then((data) => {
      data.forEach((entry) => {
        members.push({
          id: entry.user.id,
          nickname: entry.user.nickname,
          avatar: entry.user.getAvatarUrl(),
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
    const channel = await ChannelEntity.findOneBy({
      id: saveMessageDto.id,
    });
    if (channel === null) throw new BadRequestException('Channel not found');
    const mute = await ChannelRestrictionsEntity.findOneBy({
      channel: { id: channel.id },
      user: { id: userId },
      mute: LessThan(new Date()),
    });
    if (mute) throw new BadRequestException(`You are muted till ${mute.mute}`);
    const member = await ChannelMemberEntity.findOneBy({
      channel: { id: saveMessageDto.id },
      user: { id: userId },
    });
    if (member === null) throw new BadRequestException('Channel member not found');
    let message = ChannelMessageEntity.create({
      channel: { id: channel.id },
      sender: { id: member.id },
      content: saveMessageDto.content,
    });
    message = await ChannelMessageEntity.save(message);
    return {
      author: member.user.nickname,
      text: message.content,
      date: message.createdAt,
    };
  }
}
