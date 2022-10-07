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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { FriendshipDto } from './friendship.dto';
import { FriendshipService } from './friendship.service';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly _friendshipService: FriendshipService) {}

  @Post('invite')
  invite(@Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.invite(
      friendshipDto.requester,
      friendshipDto.addressee,
    );
  }

  @Put('befriend')
  befriend(@Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.befriend(
      friendshipDto.requester,
      friendshipDto.addressee,
    );
  }

  @Delete('decline')
  decline(@Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.declineFriendship(
      friendshipDto.requester,
      friendshipDto.addressee,
    );
  }

  @Delete('unfriend')
  unfriend(@Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.unfriend(
      friendshipDto.requester,
      friendshipDto.addressee,
    );
  }

  @Put('block')
  block(@Body() friendshipDto: FriendshipDto) {
    return this._friendshipService.blockFriendship(
      friendshipDto.requester,
      friendshipDto.addressee,
    );
  }

  @Get(':username')
  getRelations(@Param('username') username: string) {
    return this._friendshipService.getRelationsOf(username);
  }
}
