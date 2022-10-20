import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { FriendshipDto } from './friendship.dto';
import { FriendshipService } from './friendship.service';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly _friendshipService: FriendshipService) {}

  @Post('invite')
  invite(@Request() req, @Body() friendshipDto: FriendshipDto) {
    this._friendshipService.invite(
      req.user.payload.nickname,
      friendshipDto.addressee,
    );
  }

  @Put('befriend')
  befriend(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.befriend(
      req.user.payload.nickname,
      friendshipDto.addressee,
    );
  }

  @Delete('decline')
  decline(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.declineFriendship(
      req.user.payload.nickname,
      friendshipDto.addressee,
    );
  }

  @Delete('unfriend')
  unfriend(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.unfriend(
      req.user.payload.nickname,
      friendshipDto.addressee,
    );
  }

  @Put('block')
  block(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.blockFriendship(
      req.user.payload.nickname,
      friendshipDto.addressee,
    );
  }

  @Get()
  getRelations(@Request() req) {
    return this._friendshipService.getRelationsOf(req.user.payload.nickname);
  }

  @Get('has-invitations')
  hasInvitations(@Request() req) {
    return this._friendshipService.hasPendingInvitations(
      req.user.payload.nickname,
    );
  }
}
