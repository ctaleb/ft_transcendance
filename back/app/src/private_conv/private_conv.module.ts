import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ImageModule } from 'src/image/image.module';
import { UserEntity } from 'src/user/user.entity';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { PrivateMessageEntity } from './entities/privateMessage.entity';
import { PrivateConvEntity } from './entities/private_conv.entity';
import { PrivateConvService } from './private_conv.service';
import { PrivateConvController } from './private_conv_controller';

@Module({
  providers: [PrivateConvService, UserService],
  imports: [TypeOrmModule.forFeature([PrivateMessageEntity, PrivateConvEntity, UserEntity, FriendshipEntity]), UserModule, ImageModule, JwtModule],
  controllers: [PrivateConvController],
})
export class PrivateConvModule {}
