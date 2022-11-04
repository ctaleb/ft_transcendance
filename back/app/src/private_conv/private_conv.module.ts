import { Module } from '@nestjs/common';
import { PrivateConvService } from './private_conv.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { PrivateMessageEntity } from './entities/privateMessage.entity';
import { PrivateConvEntity } from './entities/private_conv.entity';
import { PrivateConvController } from './private_conv_controller';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { FriendshipModule } from 'src/friendship/friendship.module';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ImageModule } from 'src/image/image.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [PrivateConvService, UserService],
  imports: [
    TypeOrmModule.forFeature([
      PrivateMessageEntity,
      PrivateConvEntity,
      UserEntity,
      FriendshipEntity,
    ]),
    UserModule,
    ImageModule,
    JwtModule,
  ],
  controllers: [PrivateConvController],
})
export class PrivateConvModule {}
