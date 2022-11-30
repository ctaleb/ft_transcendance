import { forwardRef, Module } from '@nestjs/common';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { ImageService } from '../image/image.service';
import { ImageModule } from 'src/image/image.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/authentication/constants';
import { FriendshipModule } from 'src/friendship/friendship.module';
import { FriendshipService } from 'src/friendship/friendship.service';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ServerModule } from 'src/server/server.module';
import { ServerService } from 'src/server/server.service';

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
