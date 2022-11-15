import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { request } from 'http';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChangeRoleDto } from './dtos/change-role.dto';
import { CreateChannelDto } from './dtos/create-channel.dto';
import { DeclineInvitationDto } from './dtos/decline-invitation.dto';
import { GetChannelMessagesDto } from './dtos/get-channel-messages.dto';
import { GetChannelsListDto } from './dtos/get-channels-list.dto';
import { InviteToChannelDto } from './dtos/invite-to-channel.dto';
import { JoinChannelDto } from './dtos/join-channel.dto';
import { LeaveChannelDto } from './dtos/leave-channel.dto';
import { RestrictionDto } from './dtos/restriction.dto';
import { UpdateChannelDto } from './dtos/update-channel.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getChannels(@Request() req) {
    return this.chatService.getUserChannels(req.user.payload.id);
  }

  @Post('list')
  getChannelsList(
    @Request() req,
    @Body() getChannelsListDto: GetChannelsListDto,
  ) {
    return this.chatService.getChannelsList(
      getChannelsListDto,
      req.user.payload.id,
    );
  }

  @Post('load-channel')
  loadChannel(@Request() req, @Body() loadChannelDto: LeaveChannelDto) {
    return this.chatService.loadChannel(loadChannelDto, req.user.payload.id);
  }

  @Post('messages')
  getChannelMessages(
    @Request() req,
    @Body() getChannelMessagesDto: GetChannelMessagesDto,
  ) {
    return this.chatService.getChannelMessages(getChannelMessagesDto);
  }

  @Post('create-channel')
  createChannel(@Request() req, @Body() channelDto: CreateChannelDto) {
    return this.chatService.createChannel(
      channelDto,
      req.user.payload.nickname,
    );
  }

  @Put('update-channel')
  updateChannel(@Request() req, @Body() channelDto: UpdateChannelDto) {
    return this.chatService.updateChannel(channelDto, req.user.payload.id);
  }

  @Post('join-channel')
  joinChannel(@Request() req, @Body() joinChannelDto: JoinChannelDto) {
    return this.chatService.joinChannel(joinChannelDto, req.user.payload.id);
  }

  @Post('invite-to-channel')
  inviteToChannel(
    @Request() req,
    @Body() inviteToChannelDto: InviteToChannelDto,
  ) {
    return this.chatService.inviteToChannel(
      inviteToChannelDto,
      req.user.payload.id,
    );
  }

  @Put('give-admin')
  giveAdminRole(@Request() req, @Body() giveAdminRole: ChangeRoleDto) {
    return this.chatService.giveAdminRole(giveAdminRole, req.user.payload.id);
  }

  @Put('take-admin')
  takeAdminRole(@Request() req, @Body() takeAdminRole: ChangeRoleDto) {
    return this.chatService.takeAdminRole(takeAdminRole, req.user.payload.id);
  }

  @Delete('decline-invitation')
  declineInvitation(
    @Request() req,
    @Body() declineInvitationDto: DeclineInvitationDto,
  ) {
    return this.chatService.declineInvitation(
      declineInvitationDto,
      req.user.payload.id,
    );
  }

  @Delete('leave-channel')
  leaveChannel(@Request() req, @Body() leaveChannelDto: LeaveChannelDto) {
    return this.chatService.leaveChannel(leaveChannelDto, req.user.payload.id);
  }

  @Delete('delete-channel')
  deleteChannel(@Request() req, @Body() leaveChannelDto: LeaveChannelDto) {
    return this.chatService.deleteChannel(
      leaveChannelDto.id,
      req.user.payload.id,
    );
  }

  @Post('ban')
  banUser(@Request() req, @Body() restrictionDto: RestrictionDto) {
    return this.chatService.ban(restrictionDto, req.user.payload.id);
  }

  @Post('mute')
  muteUser(@Request() req, @Body() restrictionDto: RestrictionDto) {
    return this.chatService.mute(restrictionDto, req.user.payload.id);
  }

  @Post('members')
  getChannelMembers(
    @Request() req,
    @Body() getChannelMembersDto: LeaveChannelDto,
  ) {
    return this.chatService.getChannelMembers(
      getChannelMembersDto,
      req.user.payload.id,
    );
  }
}
