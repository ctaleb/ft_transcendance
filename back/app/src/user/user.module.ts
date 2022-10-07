import { Module } from '@nestjs/common';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { ImageService } from '../image/image.service';
import { ImageModule } from 'src/image/image.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/authentication/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
    TypeOrmModule.forFeature([UserEntity]),
    ImageModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UsersModule {}
