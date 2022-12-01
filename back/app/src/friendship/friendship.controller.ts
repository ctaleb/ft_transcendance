import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth.guard';
import { FriendshipDto } from './friendship.dto';
import { FriendshipService } from './friendship.service';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly _friendshipService: FriendshipService) {}

  @Post('invite')
  async invite(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return await this._friendshipService.invite(req.user.payload.nickname, friendshipDto.addressee);
  }

  @Put('befriend')
  async befriend(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return await this._friendshipService.befriend(req.user.payload.nickname, friendshipDto.addressee);
  }

  @Delete('decline')
  async decline(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return await this._friendshipService.declineFriendship(req.user.payload.nickname, friendshipDto.addressee);
  }

  @Delete('unfriend')
  async unfriend(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return await this._friendshipService.unfriend(req.user.payload.nickname, friendshipDto.addressee);
  }

  @Put('block')
  async block(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return await this._friendshipService.block(req.user.payload.nickname, friendshipDto.addressee);
  }

  @Put('unblock')
  async unblock(@Request() req, @Body() friendshipDto: FriendshipDto) {
    return await this._friendshipService.unblock(req.user.payload.nickname, friendshipDto.addressee);
  }

  @Get()
  async getRelations(@Request() req) {
    return await this._friendshipService.getRelationsOf(req.user.payload.nickname);
  }

  @Get('/profile/:name')
  async getRelationsProfile(@Request() req, @Param('name') name) {
    return await this._friendshipService.getRelationsOf(name);
  }

  @Get('has-invitations')
  async hasInvitations(@Request() req) {
    return await this._friendshipService.hasPendingInvitations(req.user.payload.nickname);
  }

  @Get('isBlocked/:id')
  async isBlocked(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return await this._friendshipService.getBlockedStatus(req.user.payload.id, id);
  }
}
