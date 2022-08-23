import { Module } from '@nestjs/common';
import { FriendListService } from './friend_list.service';
import { FriendListController } from './friend_list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendListEntity } from './entities/friend_list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FriendListEntity])],
  controllers: [FriendListController],
  providers: [FriendListService],
})
export class FriendListModule {}
