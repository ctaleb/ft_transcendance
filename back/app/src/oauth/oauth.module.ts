import { Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/authentication/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { UsersModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { ImageModule } from 'src/image/image.module';
import { ImageService } from 'src/image/image.service';
import { ImageEntity } from 'src/image/image.entity';
import { AuthenticationService } from 'src/authentication/authentication.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([ImageEntity]),
    UsersModule,
    ImageModule,
  ],
  controllers: [OauthController],
  providers: [OauthService, UserService, ImageService, AuthenticationService],
})
export class OauthModule {}
