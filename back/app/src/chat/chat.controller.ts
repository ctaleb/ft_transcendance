import {
  Body,
  Controller,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChannelDto } from './dtos/create-channel.dto';
import { InviteToChannelDto } from './dtos/invite-to-channel.dto';
import { JoinChannelDto } from './dtos/join-channel.dto';
import { UpdateChannelDto } from './dtos/update-channel.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
}
