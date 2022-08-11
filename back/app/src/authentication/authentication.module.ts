import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/user/user.module';
import { AuthenticationController } from 'src/authentication/authentication.controller';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { MulterModule } from '@nestjs/platform-express';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    UsersModule,
    ImageModule,
    TypeOrmModule.forFeature([UserEntity]),
    MulterModule.register({ dest: './assets' }),
  ],
  providers: [AuthenticationService, UserService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule {}
