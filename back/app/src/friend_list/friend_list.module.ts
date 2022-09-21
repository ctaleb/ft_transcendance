import { Module } from '@nestjs/common';
import { FriendListService } from './friend_list.service';
import { FriendListController } from './friend_list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendListEntity } from './entities/friend_list.entity';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([FriendListEntity])],
  controllers: [FriendListController],
  providers: [FriendListService, UserService],
})
export class FriendListModule {}
