import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { jwtConstants } from 'src/authentication/constants';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';
import { ImageEntity } from 'src/image/image.entity';
import { ImageModule } from 'src/image/image.module';
import { ImageService } from 'src/image/image.service';
import { UserEntity } from 'src/user/user.entity';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([ImageEntity]),
    TypeOrmModule.forFeature([FriendshipEntity]),
    UserModule,
    ImageModule,
  ],
  controllers: [OauthController],
  providers: [OauthService, UserService, ImageService, AuthenticationService],
})
export class OauthModule {}
