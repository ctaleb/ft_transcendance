import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { AuthenticationController } from 'src/authentication/authentication.controller';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { MulterModule } from '@nestjs/platform-express';
import { ImageModule } from 'src/image/image.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './constants';
import { ServerService } from 'src/server/server.service';
import { ServerModule } from 'src/server/server.module';
import { FriendshipEntity } from 'src/friendship/entities/friendship.entity';

@Module({
  imports: [
    UserModule,
    ImageModule,
    PassportModule,
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([FriendshipEntity]),
    MulterModule.register({ dest: './assets' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
    ServerModule,
  ],
  providers: [AuthenticationService, LocalStrategy, UserService, JwtStrategy],
  exports: [AuthenticationService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
