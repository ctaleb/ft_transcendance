import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FriendListService } from './friend_list.service';
import { CreateFriendListDto } from './dto/create-friend_list.dto';
import { DeleteFriendListDto } from './dto/delete-friend_list.dto';
import { FriendListEntity } from './entities/friend_list.entity';

@Controller('friend-list')
export class FriendListController {
  constructor(private readonly friendListService: FriendListService) {}

  @Post('befriend')
  befriend(
    @Body() createFriendListDto: CreateFriendListDto,
  ): Promise<FriendListEntity> {
    return this.friendListService.create(createFriendListDto);
  }

  @Get(':id')
  findAll(@Param('id') id: string): Promise<FriendListEntity[]> {
    return this.friendListService.findAll(+id);
  }

  @Delete('unfriend')
  unfriend(@Body() deleteFriendListDto: DeleteFriendListDto) {
    return this.friendListService.delete(deleteFriendListDto);
  }
}
