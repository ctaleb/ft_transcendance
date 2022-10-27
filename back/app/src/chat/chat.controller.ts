import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChannelDto } from './dtos/channel.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create-channel')
  createChannel(@Request() req, @Body() channelDto: ChannelDto) {
    return this.chatService.createChannel(
      channelDto,
      req.user.payload.nickname,
    );
  }
}
