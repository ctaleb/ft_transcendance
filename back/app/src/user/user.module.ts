import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConstants } from 'src/authentication/constants';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ImageModule } from 'src/image/image.module';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';
import { UserEntity } from './user.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([FriendshipEntity]),
    ImageModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
