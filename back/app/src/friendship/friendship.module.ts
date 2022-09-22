import { Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { UserService } from 'src/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipEntity } from './entities/friendship.entity';
import { UserEntity } from 'src/user/user.entity';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendshipEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    ImageModule,
  ],
  controllers: [FriendshipController],
  providers: [FriendshipService, UserService],
})
export class FriendshipModule {}
